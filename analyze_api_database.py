#!/usr/bin/env python3

"""
Database Connection Analysis Script
Analyzes existing API and database connections in production
"""

from pymongo import MongoClient
from datetime import datetime
import sys

def analyze_mongodb_connection():
    """Analyze MongoDB connection and collections"""
    print("🔍 === DATABASE CONNECTION ANALYSIS ===")
    print(f"Analysis Time: {datetime.now()}")
    print()
    
    # Production MongoDB URL (with proper escaping)
    mongodb_url = "mongodb://admin:Sim!44335599@mongo-primary:27017,mongo-secondary-1:27017,mongo-secondary-2:27017/evep?replicaSet=rs0&authSource=admin"
    
    try:
        print("📡 Connecting to MongoDB cluster...")
        client = MongoClient(mongodb_url, serverSelectionTimeoutMS=10000)
        
        # Test connection
        client.admin.command('ping')
        print("✅ MongoDB cluster connection successful")
        
        # Get database info
        db = client.evep
        collections = db.list_collection_names()
        print(f"📊 Database: evep")
        print(f"📋 Total collections: {len(collections)}")
        print()
        
        print("🗂️  === EXISTING COLLECTIONS ===")
        for i, collection in enumerate(sorted(collections), 1):
            print(f"   {i:2d}. {collection}")
        print()
        
        # Check for hospital mobile workflow collections
        workflow_collections = []
        for col in collections:
            if any(keyword in col.lower() for keyword in ['hospital', 'mobile', 'workflow', 'session', 'screening']):
                workflow_collections.append(col)
        
        if workflow_collections:
            print("🏥 === HOSPITAL/MOBILE/WORKFLOW COLLECTIONS ===")
            for col in workflow_collections:
                doc_count = db[col].count_documents({})
                print(f"   📁 {col}: {doc_count} documents")
            print()
        
        # Check for FIFO collections
        fifo_collections = ['field_change_queue', 'field_conflicts', 'field_versions', 'fifo_processing_logs']
        existing_fifo = [col for col in fifo_collections if col in collections]
        missing_fifo = [col for col in fifo_collections if col not in collections]
        
        print("🔄 === FIFO IMPLEMENTATION STATUS ===")
        if existing_fifo:
            print("✅ FIFO collections found:")
            for col in existing_fifo:
                doc_count = db[col].count_documents({})
                print(f"   📁 {col}: {doc_count} documents")
        
        if missing_fifo:
            print("⚠️  FIFO collections to be created:")
            for col in missing_fifo:
                print(f"   📁 {col}: Will be created on first use")
        print()
        
        # Test a sample query
        print("🧪 === DATABASE FUNCTIONALITY TEST ===")
        
        # Try to find users collection
        if 'users' in collections:
            user_count = db.users.count_documents({})
            print(f"👥 Users collection: {user_count} documents")
            
            # Sample user (without sensitive data)
            sample_user = db.users.find_one({}, {'password': 0, 'password_hash': 0})
            if sample_user:
                print(f"🔸 Sample user fields: {list(sample_user.keys())}")
        
        # Try to find patients collection
        if 'patients' in collections:
            patient_count = db.patients.count_documents({})
            print(f"🏥 Patients collection: {patient_count} documents")
        
        # Try to find screenings collection
        if 'screenings' in collections:
            screening_count = db.screenings.count_documents({})
            print(f"👁️  Screenings collection: {screening_count} documents")
        
        print("✅ Database functionality test complete")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        return False

def analyze_api_endpoints():
    """Analyze API endpoints structure"""
    print("\n🌐 === API ENDPOINTS ANALYSIS ===")
    print()
    
    try:
        import os
        
        # Check API directory structure
        api_dir = "/www/dk_project/evep-my-firstcare-com/backend/app/api"
        
        if os.path.exists(api_dir):
            api_files = []
            for root, dirs, files in os.walk(api_dir):
                for file in files:
                    if file.endswith('.py') and not file.startswith('__'):
                        rel_path = os.path.relpath(os.path.join(root, file), api_dir)
                        api_files.append(rel_path)
            
            print("📁 API Modules Found:")
            for api_file in sorted(api_files):
                print(f"   🔸 {api_file}")
            print()
            
            # Check for hospital mobile API
            hospital_mobile_apis = [f for f in api_files if 'hospital' in f.lower() or 'mobile' in f.lower()]
            
            if hospital_mobile_apis:
                print("🏥 Hospital/Mobile APIs:")
                for api in hospital_mobile_apis:
                    print(f"   ✅ {api}")
            else:
                print("⚠️  No hospital/mobile specific APIs found")
            print()
            
        return True
        
    except Exception as e:
        print(f"❌ API analysis failed: {e}")
        return False

def check_environment_variables():
    """Check environment variables"""
    print("\n🔧 === ENVIRONMENT CONFIGURATION ===")
    print()
    
    import os
    
    env_vars = [
        'MONGODB_URL',
        'DATABASE_URL', 
        'REDIS_URL',
        'SECRET_KEY',
        'JWT_SECRET_KEY',
        'ENVIRONMENT'
    ]
    
    for var in env_vars:
        value = os.getenv(var)
        if value:
            # Mask sensitive values
            if 'secret' in var.lower() or 'password' in var.lower():
                display_value = f"{value[:10]}..." if len(value) > 10 else "***"
            elif 'url' in var.lower() and '@' in value:
                # Mask credentials in URLs
                display_value = value.split('@')[1] if '@' in value else value
            else:
                display_value = value
            
            print(f"   ✅ {var}: {display_value}")
        else:
            print(f"   ❌ {var}: Not set")
    print()

def main():
    """Main analysis function"""
    print("🚀 === PRODUCTION API & DATABASE CONNECTION ANALYSIS ===")
    print("=" * 60)
    print()
    
    results = {}
    
    # Test database connection
    results['database'] = analyze_mongodb_connection()
    
    # Analyze API endpoints  
    results['api'] = analyze_api_endpoints()
    
    # Check environment
    results['environment'] = check_environment_variables()
    
    print("📋 === ANALYSIS SUMMARY ===")
    print()
    
    for component, status in results.items():
        status_icon = "✅" if status else "❌"
        print(f"   {status_icon} {component.upper()}: {'Operational' if status else 'Issues detected'}")
    
    print()
    
    if all(results.values()):
        print("🎉 All systems operational - Ready for FIFO integration!")
    else:
        print("⚠️  Some issues detected - Review required before FIFO integration")
    
    print(f"\n✅ Analysis completed: {datetime.now()}")
    
    return all(results.values())

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)