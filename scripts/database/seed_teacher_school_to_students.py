#!/usr/bin/env python3
"""
Script to seed teachers and schools to students using the EVEP API.
This script will:
1. Fetch all students, teachers, and schools
2. Assign teachers to students based on grade level matching
3. Assign schools to students based on their teacher's school
4. Update student records via API calls
"""

import asyncio
import aiohttp
import json
from typing import List, Dict, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# API Configuration
API_BASE_URL = "http://backend:8000/api/v1/evep"
ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjhiNDA2YmMyNDAyNThiMjU1Y2QwNTg1IiwiZW1haWwiOiJhZG1pbkBldmVwLmNvbSIsInJvbGUiOiJhZG1pbiIsInRva2VuX3R5cGUiOiJhY2Nlc3MiLCJleHAiOjE3NTY4MzYwMDUsImlhdCI6MTc1Njc0OTYwNX0.LV5cMWxvUPZBTF81KrpqrR-kjRffV-iIicKO3VifgL8"

class StudentTeacherSchoolSeeder:
    def __init__(self, api_base_url: str, admin_token: str):
        self.api_base_url = api_base_url
        self.admin_token = admin_token
        self.headers = {
            "Authorization": f"Bearer {admin_token}",
            "Content-Type": "application/json"
        }
    
    async def fetch_data(self, session: aiohttp.ClientSession, endpoint: str) -> List[Dict[str, Any]]:
        """Fetch data from API endpoint"""
        try:
            url = f"{self.api_base_url}/{endpoint}"
            async with session.get(url, headers=self.headers) as response:
                if response.status == 200:
                    data = await response.json()
                    # Handle different response structures
                    if isinstance(data, dict):
                        if 'students' in data:
                            return data['students']
                        elif 'teachers' in data:
                            return data['teachers']
                        elif 'schools' in data:
                            return data['schools']
                        else:
                            return data
                    elif isinstance(data, list):
                        return data
                    else:
                        logger.error(f"Unexpected response format from {endpoint}: {type(data)}")
                        return []
                else:
                    logger.error(f"Failed to fetch {endpoint}: {response.status}")
                    return []
        except Exception as e:
            logger.error(f"Error fetching {endpoint}: {e}")
            return []
    
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
    
    async def update_student(self, session: aiohttp.ClientSession, student_id: str, update_data: Dict[str, Any]) -> bool:
        """Update student record via API"""
        try:
            url = f"{self.api_base_url}/students/{student_id}"
            async with session.put(url, headers=self.headers, json=update_data) as response:
                if response.status == 200:
                    logger.info(f"Successfully updated student {student_id}")
                    return True
                else:
                    error_text = await response.text()
                    logger.error(f"Failed to update student {student_id}: {response.status} - {error_text}")
                    return False
        except Exception as e:
            logger.error(f"Error updating student {student_id}: {e}")
            return False
    
    async def seed_teacher_school_to_students(self):
        """Main method to seed teachers and schools to students"""
        async with aiohttp.ClientSession() as session:
            logger.info("Starting to seed teachers and schools to students...")
            
            # Fetch all data
            logger.info("Fetching students, teachers, and schools...")
            students = await self.fetch_data(session, "students")
            teachers = await self.fetch_data(session, "teachers")
            schools = await self.fetch_data(session, "schools")
            
            if not students:
                logger.error("No students found")
                return
            
            if not teachers:
                logger.error("No teachers found")
                return
            
            if not schools:
                logger.error("No schools found")
                return
            
            logger.info(f"Found {len(students)} students, {len(teachers)} teachers, {len(schools)} schools")
            
            # Process each student
            updated_count = 0
            failed_count = 0
            
            for student in students:
                try:
                    student_id = student.get('id') or student.get('_id')
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
                        logger.warning(f"No school available for teacher {matched_teacher.get('id')}")
                        continue
                    
                    # Prepare update data
                    update_data = {
                        "teacher_id": str(matched_teacher.get('id') or matched_teacher.get('_id')),
                        "school_name": matched_school.get('name', ''),
                        # Keep existing student data
                        "title": student.get('title', ''),
                        "first_name": student.get('first_name', ''),
                        "last_name": student.get('last_name', ''),
                        "cid": student.get('cid', ''),
                        "birth_date": student.get('birth_date', ''),
                        "gender": student.get('gender', ''),
                        "student_code": student.get('student_code', ''),
                        "grade_level": student.get('grade_level', ''),
                        "grade_number": student.get('grade_number', ''),
                        "parent_id": student.get('parent_id', ''),
                        "consent_document": student.get('consent_document', False),
                        "profile_photo": student.get('profile_photo', ''),
                        "extra_photos": student.get('extra_photos', []),
                        "photo_metadata": student.get('photo_metadata', {}),
                        "address": student.get('address', {}),
                        "disease": student.get('disease', ''),
                        "status": student.get('status', 'active')
                    }
                    
                    # Update student
                    if await self.update_student(session, student_id, update_data):
                        updated_count += 1
                        logger.info(f"Updated student {student_id} with teacher {matched_teacher.get('first_name')} {matched_teacher.get('last_name')} and school {matched_school.get('name')}")
                    else:
                        failed_count += 1
                        
                except Exception as e:
                    logger.error(f"Error processing student {student.get('id', 'unknown')}: {e}")
                    failed_count += 1
            
            logger.info(f"Seeding completed! Updated: {updated_count}, Failed: {failed_count}")

async def main():
    """Main function"""
    seeder = StudentTeacherSchoolSeeder(API_BASE_URL, ADMIN_TOKEN)
    await seeder.seed_teacher_school_to_students()

if __name__ == "__main__":
    asyncio.run(main())
