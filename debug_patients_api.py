#!/usr/bin/env python3
"""
Debug script to check patients database contents
"""

from pymongo import MongoClient

# Configuration
MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "evep_system"

def check_database_collections():
    """Check what's actually in the database"""
    print("🗄️  Checking Database Collections...")
    
    try:
        # Connect to MongoDB
        client = MongoClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        
        # Check patients collection
        patients_collection = db.patients
        patient_count = patients_collection.count_documents({})
        print(f"📊 Patients Collection: {patient_count} documents")
        
        if patient_count > 0:
            sample_patient = patients_collection.find_one({})
            if sample_patient:
                print(f"🔸 Sample patient keys: {list(sample_patient.keys())}")
                print(f"🔸 Sample patient name: {sample_patient.get('first_name', 'N/A')} {sample_patient.get('last_name', 'N/A')}")
        
        # Check evep.students collection
        students_collection = db.evep["evep.students"]
        student_count = students_collection.count_documents({})
        print(f"📊 EVEP Students Collection: {student_count} documents")
        
        if student_count > 0:
            sample_student = students_collection.find_one({})
            if sample_student:
                print(f"🔸 Sample student keys: {list(sample_student.keys())}")
                print(f"🔸 Sample student name: {sample_student.get('first_name', 'N/A')} {sample_student.get('last_name', 'N/A')}")
            
        # Check collections list
        collections = db.list_collection_names()
        print(f"📋 Available collections: {collections}")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Database Error: {e}")

if __name__ == "__main__":
    check_database_collections()