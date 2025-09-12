#!/usr/bin/env python3
"""
Script to copy student data from the main students collection to the evep.students collection.
This ensures that the API endpoints return complete student data including teacher_id and school_name.
"""

from pymongo import MongoClient
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MongoDB Configuration
MONGO_URI = "mongodb://mongo-primary:27017"
DB_NAME = "evep"

def copy_students_to_evep():
    """Copy student data from students collection to evep.students collection"""
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        
        logger.info("Starting to copy students to evep.students collection...")
        
        # Get all students from main collection
        students = list(db.students.find({}))
        logger.info(f"Found {len(students)} students in main collection")
        
        if not students:
            logger.error("No students found in main collection")
            return
        
        # Clear existing evep.students collection
        db['evep.students'].delete_many({})
        logger.info("Cleared existing evep.students collection")
        
        # Copy students to evep.students collection
        copied_count = 0
        for student in students:
            try:
                # Ensure all required fields are present
                student_data = {
                    "_id": student.get("_id"),
                    "title": student.get("title", ""),
                    "first_name": student.get("first_name", ""),
                    "last_name": student.get("last_name", ""),
                    "cid": student.get("cid", ""),
                    "student_code": student.get("student_code", ""),
                    "grade_level": student.get("grade_level", ""),
                    "grade_number": student.get("grade_number", ""),
                    "school_name": student.get("school_name", ""),
                    "birth_date": student.get("birth_date", ""),
                    "gender": student.get("gender", ""),
                    "parent_id": student.get("parent_id", ""),
                    "teacher_id": student.get("teacher_id", ""),
                    "consent_document": student.get("consent_document", False),
                    "profile_photo": student.get("profile_photo", ""),
                    "extra_photos": student.get("extra_photos", []),
                    "photo_metadata": student.get("photo_metadata", {}),
                    "address": student.get("address", {}),
                    "disease": student.get("disease", ""),
                    "status": student.get("status", "active"),
                    "created_at": student.get("created_at", ""),
                    "updated_at": student.get("updated_at", "")
                }
                
                # Insert into evep.students collection
                result = db['evep.students'].insert_one(student_data)
                if result.inserted_id:
                    copied_count += 1
                    logger.info(f"Copied student: {student.get('first_name')} {student.get('last_name')}")
                
            except Exception as e:
                logger.error(f"Error copying student {student.get('_id')}: {e}")
        
        logger.info(f"Copy completed! Copied {copied_count} students to evep.students collection")
        
        # Verify the copy
        evep_count = db['evep.students'].count_documents({})
        logger.info(f"evep.students collection now contains {evep_count} students")
        
        # Check a sample student
        sample = db['evep.students'].find_one({})
        if sample:
            logger.info(f"Sample student - teacher_id: {sample.get('teacher_id')}, school_name: {sample.get('school_name')}")
        
    except Exception as e:
        logger.error(f"Error copying students: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    copy_students_to_evep()
