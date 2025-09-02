#!/usr/bin/env python3
from pymongo import MongoClient

# Connect to MongoDB
client = MongoClient('mongodb://mongo-primary:27017')
db = client.evep

print("=== SCHOOLS DATA ===")
schools = list(db.schools.find({}))
print(f"Total schools: {len(schools)}")

print("\nSample schools:")
for i, school in enumerate(schools[:5]):
    print(f"{i+1}. {school.get('name', 'N/A')} - Type: {school.get('type', 'N/A')} - Code: {school.get('school_code', 'N/A')}")

print("\n=== EVEP SCHOOLS DATA ===")
evep_schools = list(db['evep.schools'].find({}))
print(f"Total evep schools: {len(evep_schools)}")

print("\nSample evep schools:")
for i, school in enumerate(evep_schools[:5]):
    print(f"{i+1}. {school.get('name', 'N/A')} - Type: {school.get('type', 'N/A')} - Code: {school.get('school_code', 'N/A')}")

print("\n=== TEACHERS SCHOOL DATA ===")
teachers = list(db.teachers.find({}))
print(f"Total teachers: {len(teachers)}")

print("\nSample teachers:")
for i, teacher in enumerate(teachers[:5]):
    print(f"{i+1}. {teacher.get('first_name', '')} {teacher.get('last_name', '')} - School: {teacher.get('school', 'N/A')}")

print("\n=== TEACHERS IN EVEP COLLECTION ===")
evep_teachers = list(db['evep.teachers'].find({}))
print(f"Total evep teachers: {len(evep_teachers)}")

print("\nSample evep teachers:")
for i, teacher in enumerate(evep_teachers[:5]):
    print(f"{i+1}. {teacher.get('first_name', '')} {teacher.get('last_name', '')} - School: {teacher.get('school', 'N/A')}")

print("\n=== STUDENT SCHOOL ASSIGNMENTS ===")
students = list(db['evep.students'].find({}))
school_names = set(s.get('school_name') for s in students if s.get('school_name'))
print(f"Students assigned schools: {len(school_names)}")
print("School names assigned to students:")
for school in school_names:
    print(f"- {school}")

print(f"\nTotal students: {len(students)}")
students_with_school = len([s for s in students if s.get('school_name')])
print(f"Students with school: {students_with_school}")

client.close()
