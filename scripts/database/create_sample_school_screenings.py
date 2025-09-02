#!/usr/bin/env python3
import asyncio
import aiohttp
import random
from datetime import datetime, timedelta

async def create_sample_school_screenings():
    """Create sample school screenings for testing"""
    
    # Get authentication token
    async with aiohttp.ClientSession() as session:
        # Login to get token
        login_data = {
            "email": "doctor@evep.com",
            "password": "demo123"
        }
        
        login_response = await session.post(
            "http://backend:8000/api/v1/auth/login",
            json=login_data
        )
        
        if login_response.status != 200:
            print("❌ Failed to login")
            return
        
        token_data = await login_response.json()
        token = token_data["access_token"]
        
        print("✅ Successfully logged in")
        
        # Get students, teachers, and schools from database
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
        db = client.evep
        
        students = await db.students.find({}).to_list(length=None)
        teachers = await db.teachers.find({}).to_list(length=None)
        schools = await db.schools.find({}).to_list(length=None)
        
        print(f"📊 Found {len(students)} students, {len(teachers)} teachers, {len(schools)} schools")
        
        # Screening types
        screening_types = [
            "basic_school",
            "vision_test", 
            "color_blindness",
            "depth_perception"
        ]
        
        # Create sample screenings
        created_count = 0
        failed_count = 0
        
        # Create screenings for a subset of students
        for i, student in enumerate(students[:20]):  # First 20 students
            try:
                # Select a teacher from the same school
                student_school_name = student.get('school_name', '')
                available_teachers = [t for t in teachers if t.get('school', '') == student_school_name]
                
                if not available_teachers:
                    # If no teacher from same school, use any teacher
                    available_teachers = teachers
                
                selected_teacher = random.choice(available_teachers)
                
                # Find the school record
                school = None
                for s in schools:
                    if s.get('name', '') == student_school_name:
                        school = s
                        break
                
                if not school:
                    print(f"⚠️ No school record found for {student_school_name}")
                    continue
                
                # Create screening data
                screening_data = {
                    "student_id": str(student["_id"]),
                    "teacher_id": str(selected_teacher["_id"]),
                    "school_id": str(school["_id"]),
                    "screening_type": random.choice(screening_types),
                    "screening_date": (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat(),
                    "notes": f"Sample screening for {student.get('first_name', '')} {student.get('last_name', '')}"
                }
                
                # Create screening via API
                create_response = await session.post(
                    "http://backend:8000/api/v1/evep/school-screenings",
                    json=screening_data,
                    headers={"Authorization": f"Bearer {token}"}
                )
                
                if create_response.status == 200:
                    created_count += 1
                    response_data = await create_response.json()
                    screening_id = response_data.get("screening_id", "")
                    
                    print(f"✅ Created screening {screening_id} for {student.get('first_name', '')} {student.get('last_name', '')}")
                    
                    # Update some screenings with results
                    if random.random() < 0.7:  # 70% chance to add results
                        # Generate realistic screening results
                        results = []
                        for eye in ["left", "right"]:
                            result = {
                                "eye": eye,
                                "distance_acuity": random.choice(["20/20", "20/25", "20/30", "20/40", "20/50"]),
                                "near_acuity": random.choice(["20/20", "20/25", "20/30", "20/40"]),
                                "color_vision": random.choice(["normal", "deficient", "failed"]),
                                "depth_perception": random.choice(["normal", "impaired", "failed"])
                            }
                            results.append(result)
                        
                        # Determine conclusion and recommendations
                        has_issues = any(r["distance_acuity"] in ["20/40", "20/50"] or r["color_vision"] in ["deficient", "failed"] for r in results)
                        
                        update_data = {
                            "results": results,
                            "conclusion": "Vision screening normal - no immediate action required" if not has_issues else "Vision issues detected - referral recommended",
                            "recommendations": "Continue regular eye care; Annual vision screening recommended" if not has_issues else "Refer to ophthalmologist for comprehensive eye examination",
                            "referral_needed": has_issues,
                            "referral_notes": "Student shows signs of vision impairment requiring professional evaluation" if has_issues else None,
                            "status": "completed",
                            "notes": f"Completed screening for {student.get('first_name', '')} {student.get('last_name', '')}"
                        }
                        
                        # Update screening with results
                        update_response = await session.put(
                            f"http://backend:8000/api/v1/evep/school-screenings/{screening_id}",
                            json=update_data,
                            headers={"Authorization": f"Bearer {token}"}
                        )
                        
                        if update_response.status == 200:
                            print(f"   ✅ Updated with results - Referral needed: {has_issues}")
                        else:
                            error_text = await update_response.text()
                            print(f"   ❌ Failed to update results: {error_text}")
                    
                else:
                    failed_count += 1
                    error_text = await create_response.text()
                    print(f"❌ Failed to create screening for {student.get('first_name', '')}: {error_text}")
                
                # Small delay to avoid overwhelming the API
                await asyncio.sleep(0.1)
                
            except Exception as e:
                failed_count += 1
                print(f"❌ Error creating screening for student {i}: {e}")
        
        print(f"\n📊 Screening Creation Summary:")
        print(f"   Successfully created: {created_count}")
        print(f"   Failed creations: {failed_count}")
        print(f"   Total students processed: {min(20, len(students))}")
        
        # Verify the screenings
        total_screenings = await db.school_screenings.count_documents({})
        completed_screenings = await db.school_screenings.count_documents({"status": "completed"})
        pending_screenings = await db.school_screenings.count_documents({"status": "pending"})
        referrals_needed = await db.school_screenings.count_documents({"referral_needed": True})
        
        print(f"\n📊 Database Verification:")
        print(f"   Total screenings in database: {total_screenings}")
        print(f"   Completed screenings: {completed_screenings}")
        print(f"   Pending screenings: {pending_screenings}")
        print(f"   Referrals needed: {referrals_needed}")
        
        # Show sample screenings
        sample_screenings = await db.school_screenings.find({}).limit(5).to_list(length=None)
        print(f"\n📋 Sample Screenings Created:")
        for screening in sample_screenings:
            student_name = screening.get('student_name', '')
            teacher_name = screening.get('teacher_name', '')
            screening_type = screening.get('screening_type', '')
            status = screening.get('status', '')
            referral_needed = screening.get('referral_needed', False)
            
            print(f"   {student_name} - {screening_type} - {status} - Referral: {referral_needed}")
            print(f"      Teacher: {teacher_name}")
            print()
        
        client.close()

if __name__ == "__main__":
    asyncio.run(create_sample_school_screenings())

