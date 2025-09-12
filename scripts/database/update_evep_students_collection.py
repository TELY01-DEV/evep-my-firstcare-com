#!/usr/bin/env python3
"""
Script to directly update the evep.students collection with teacher and school data.
This script will:
1. Fetch all students, teachers, and schools from the evep collections
2. Assign teachers to students based on grade level matching
3. Assign schools to students based on their teacher's school
4. Update the evep.students collection directly
"""

from pymongo import MongoClient
from typing import List, Dict, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MongoDB Configuration
MONGO_URI = "mongodb://mongo-primary:27017"
DB_NAME = "evep"

class EvepStudentUpdater:
    def __init__(self, mongo_uri: str, db_name: str):
        self.client = MongoClient(mongo_uri)
        self.db = self.client[db_name]
    
    def match_teacher_to_student(self, student: Dict[str, Any], teachers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Match a teacher to a student based on grade level"""
        student_grade = student.get('grade_level', '')
        
        # Try to find a teacher with matching grade level
        for teacher in teachers:
            teacher_grade = teacher.get('grade_level', '')
            if teacher_grade and student_grade and teacher_grade == student_grade:
                return teacher
        
        # If no exact match, try to find any available teacher
        for teacher in teachers:
            if teacher.get('status') == 'active':
                return teacher
        
        # Return first available teacher as fallback
        return teachers[0] if teachers else None
    
    def get_school_from_teacher(self, teacher: Dict[str, Any], schools: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Get school information from teacher"""
        teacher_school_name = teacher.get('school', '')
        
        # Try to find exact school name match
        for school in schools:
            if school.get('name') == teacher_school_name:
                return school
        
        # If no exact match, return first available school as fallback
        return schools[0] if schools else None
    
    def update_evep_students(self):
        """Update evep.students collection with teacher and school data"""
        try:
            logger.info("Starting to update evep.students collection...")
            
            # Fetch all data from evep collections
            logger.info("Fetching students, teachers, and schools from evep collections...")
            students = list(self.db['evep.students'].find({}))
            teachers = list(self.db['evep.teachers'].find({}))
            schools = list(self.db['evep.schools'].find({}))
            
            if not students:
                logger.error("No students found in evep.students collection")
                return
            
            if not teachers:
                logger.error("No teachers found in evep.teachers collection")
                return
            
            if not schools:
                logger.error("No schools found in evep.schools collection")
                return
            
            logger.info(f"Found {len(students)} students, {len(teachers)} teachers, {len(schools)} schools")
            
            # Process each student
            updated_count = 0
            failed_count = 0
            
            for student in students:
                try:
                    student_id = student.get('_id')
                    if not student_id:
                        logger.warning(f"Student missing ID: {student}")
                        continue
                    
                    # Match teacher to student
                    matched_teacher = self.match_teacher_to_student(student, teachers)
                    if not matched_teacher:
                        logger.warning(f"No teacher available for student {student_id}")
                        continue
                    
                    # Get school from teacher
                    matched_school = self.get_school_from_teacher(matched_teacher, schools)
                    if not matched_school:
                        logger.warning(f"No school available for teacher {matched_teacher.get('_id')}")
                        continue
                    
                    # Update student with teacher and school
                    update_result = self.db['evep.students'].update_one(
                        {"_id": student_id},
                        {
                            "$set": {
                                "teacher_id": str(matched_teacher.get('_id')),
                                "school_name": matched_school.get('name', '')
                            }
                        }
                    )
                    
                    if update_result.modified_count > 0:
                        updated_count += 1
                        logger.info(f"Updated student {student_id} with teacher {matched_teacher.get('first_name')} {matched_teacher.get('last_name')} and school {matched_school.get('name')}")
                    else:
                        logger.warning(f"No changes made to student {student_id}")
                        
                except Exception as e:
                    logger.error(f"Error processing student {student.get('_id', 'unknown')}: {e}")
                    failed_count += 1
            
            logger.info(f"Update completed! Updated: {updated_count}, Failed: {failed_count}")
            
        except Exception as e:
            logger.error(f"Error updating evep.students collection: {e}")
        finally:
            self.client.close()

def main():
    """Main function"""
    updater = EvepStudentUpdater(MONGO_URI, DB_NAME)
    updater.update_evep_students()

if __name__ == "__main__":
    main()
