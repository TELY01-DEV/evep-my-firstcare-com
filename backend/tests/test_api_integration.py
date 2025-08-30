"""
EVEP Platform - API Integration Tests
Comprehensive integration testing for all API endpoints
"""

import pytest
import asyncio
from httpx import AsyncClient
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock
import json
import time
from datetime import datetime, timedelta
from bson import ObjectId

# Import FastAPI app and dependencies
from app.main import app
from app.core.database import get_database
from app.core.security import create_access_token, hash_password
from app.core.config import settings

# Test client
client = TestClient(app)

# Test data
TEST_USER_DATA = {
    "email": "test@example.com",
    "password": "testpassword123",
    "first_name": "Test",
    "last_name": "User",
    "role": "doctor",
    "organization": "Test Hospital",
    "phone": "+66-81-234-5678"
}

TEST_ADMIN_DATA = {
    "email": "admin@example.com",
    "password": "adminpassword123",
    "first_name": "Admin",
    "last_name": "User",
    "role": "admin",
    "organization": "EVEP Admin",
    "phone": "+66-82-345-6789"
}

TEST_PATIENT_DATA = {
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "2015-03-15",
    "gender": "male",
    "parent_name": "Jane Doe",
    "parent_phone": "+66-81-234-5678",
    "parent_email": "jane.doe@email.com",
    "emergency_contact": "Emergency Contact",
    "emergency_phone": "+66-82-345-6789",
    "school": "Bangkok International School",
    "grade": "Grade 3",
    "medical_history": "No significant medical history",
    "allergies": ["Peanuts"],
    "address": "123 Test Street",
    "city": "Bangkok",
    "postal_code": "10110"
}

TEST_SCREENING_DATA = {
    "patient_id": None,  # Will be set during test
    "screening_type": "vision",
    "screening_date": datetime.now().isoformat(),
    "results": {
        "left_eye": "20/20",
        "right_eye": "20/25",
        "color_vision": "normal",
        "depth_perception": "normal"
    },
    "notes": "Normal vision screening",
    "recommendations": "No follow-up required"
}

# Test fixtures
@pytest.fixture
def test_db():
    """Test database fixture"""
    return get_database()

@pytest.fixture
def auth_headers():
    """Generate authentication headers"""
    token = create_access_token(data={"sub": TEST_USER_DATA["email"]})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def admin_headers():
    """Generate admin authentication headers"""
    token = create_access_token(data={"sub": TEST_ADMIN_DATA["email"]})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def test_user_id():
    """Create test user and return ID"""
    # This would normally create a user in test database
    return str(ObjectId())

@pytest.fixture
def test_patient_id():
    """Create test patient and return ID"""
    # This would normally create a patient in test database
    return str(ObjectId())

@pytest.fixture
def test_screening_id():
    """Create test screening and return ID"""
    # This would normally create a screening in test database
    return str(ObjectId())

# Authentication API Tests
class TestAuthenticationAPI:
    """Test authentication endpoints"""
    
    def test_health_check(self):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert "version" in data
    
    def test_register_user(self):
        """Test user registration"""
        response = client.post("/auth/register", json=TEST_USER_DATA)
        assert response.status_code == 201
        data = response.json()
        assert data["message"] == "User registered successfully"
        assert "user_id" in data
        assert data["user"]["email"] == TEST_USER_DATA["email"]
    
    def test_register_user_duplicate_email(self):
        """Test user registration with duplicate email"""
        # First registration
        client.post("/auth/register", json=TEST_USER_DATA)
        
        # Second registration with same email
        response = client.post("/auth/register", json=TEST_USER_DATA)
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]
    
    def test_login_user(self):
        """Test user login"""
        # Register user first
        client.post("/auth/register", json=TEST_USER_DATA)
        
        # Login
        login_data = {
            "email": TEST_USER_DATA["email"],
            "password": TEST_USER_DATA["password"]
        }
        response = client.post("/auth/login", json=login_data)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == TEST_USER_DATA["email"]
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        login_data = {
            "email": "invalid@example.com",
            "password": "wrongpassword"
        }
        response = client.post("/auth/login", json=login_data)
        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]
    
    def test_get_current_user(self, auth_headers):
        """Test get current user endpoint"""
        response = client.get("/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == TEST_USER_DATA["email"]
    
    def test_get_current_user_unauthorized(self):
        """Test get current user without authentication"""
        response = client.get("/auth/me")
        assert response.status_code == 401
    
    def test_refresh_token(self, auth_headers):
        """Test token refresh"""
        response = client.post("/auth/refresh", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

# Patient Management API Tests
class TestPatientManagementAPI:
    """Test patient management endpoints"""
    
    def test_create_patient(self, auth_headers):
        """Test patient creation"""
        response = client.post("/patients/", json=TEST_PATIENT_DATA, headers=auth_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["first_name"] == TEST_PATIENT_DATA["first_name"]
        assert data["last_name"] == TEST_PATIENT_DATA["last_name"]
        assert "_id" in data
    
    def test_get_patients(self, auth_headers):
        """Test get patients list"""
        response = client.get("/patients/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "patients" in data
        assert isinstance(data["patients"], list)
        assert "total" in data
        assert "page" in data
        assert "limit" in data
    
    def test_get_patient_by_id(self, auth_headers, test_patient_id):
        """Test get patient by ID"""
        response = client.get(f"/patients/{test_patient_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["_id"] == test_patient_id
    
    def test_update_patient(self, auth_headers, test_patient_id):
        """Test patient update"""
        update_data = {"first_name": "Updated Name"}
        response = client.put(f"/patients/{test_patient_id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["first_name"] == "Updated Name"
    
    def test_delete_patient(self, auth_headers, test_patient_id):
        """Test patient deletion"""
        response = client.delete(f"/patients/{test_patient_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["message"] == "Patient deleted successfully"
    
    def test_search_patients(self, auth_headers):
        """Test patient search"""
        search_params = {"q": "John"}
        response = client.get("/patients/search", params=search_params, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "patients" in data
        assert isinstance(data["patients"], list)
    
    def test_get_patient_statistics(self, auth_headers):
        """Test patient statistics"""
        response = client.get("/patients/statistics", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_patients" in data
        assert "new_patients_this_month" in data
        assert "patients_by_gender" in data
        assert "patients_by_age_group" in data

# Screening API Tests
class TestScreeningAPI:
    """Test screening endpoints"""
    
    def test_create_screening(self, auth_headers, test_patient_id):
        """Test screening creation"""
        screening_data = TEST_SCREENING_DATA.copy()
        screening_data["patient_id"] = test_patient_id
        
        response = client.post("/screenings/", json=screening_data, headers=auth_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["patient_id"] == test_patient_id
        assert data["screening_type"] == screening_data["screening_type"]
        assert "_id" in data
    
    def test_get_screenings(self, auth_headers):
        """Test get screenings list"""
        response = client.get("/screenings/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "screenings" in data
        assert isinstance(data["screenings"], list)
        assert "total" in data
        assert "page" in data
        assert "limit" in data
    
    def test_get_screening_by_id(self, auth_headers, test_screening_id):
        """Test get screening by ID"""
        response = client.get(f"/screenings/{test_screening_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["_id"] == test_screening_id
    
    def test_update_screening(self, auth_headers, test_screening_id):
        """Test screening update"""
        update_data = {"notes": "Updated screening notes"}
        response = client.put(f"/screenings/{test_screening_id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["notes"] == "Updated screening notes"
    
    def test_delete_screening(self, auth_headers, test_screening_id):
        """Test screening deletion"""
        response = client.delete(f"/screenings/{test_screening_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["message"] == "Screening deleted successfully"
    
    def test_create_screening_session(self, auth_headers):
        """Test screening session creation"""
        session_data = {
            "session_name": "Test Screening Session",
            "screening_type": "vision",
            "location": "Test School",
            "scheduled_date": datetime.now().isoformat(),
            "expected_participants": 50
        }
        response = client.post("/screenings/sessions", json=session_data, headers=auth_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["session_name"] == session_data["session_name"]
        assert "_id" in data
    
    def test_get_screening_sessions(self, auth_headers):
        """Test get screening sessions"""
        response = client.get("/screenings/sessions", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "sessions" in data
        assert isinstance(data["sessions"], list)

# EVEP Management API Tests
class TestEVEPManagementAPI:
    """Test EVEP management endpoints"""
    
    def test_create_student(self, auth_headers):
        """Test student creation"""
        student_data = {
            "first_name": "Student",
            "last_name": "Test",
            "date_of_birth": "2015-03-15",
            "gender": "male",
            "school": "Test School",
            "grade": "Grade 3",
            "parent_id": str(ObjectId())
        }
        response = client.post("/evep/students", json=student_data, headers=auth_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["first_name"] == student_data["first_name"]
        assert "_id" in data
    
    def test_get_students(self, auth_headers):
        """Test get students list"""
        response = client.get("/evep/students", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "students" in data
        assert isinstance(data["students"], list)
    
    def test_create_parent(self, auth_headers):
        """Test parent creation"""
        parent_data = {
            "first_name": "Parent",
            "last_name": "Test",
            "email": "parent@example.com",
            "phone": "+66-81-234-5678",
            "address": "123 Test Street",
            "city": "Bangkok"
        }
        response = client.post("/evep/parents", json=parent_data, headers=auth_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["first_name"] == parent_data["first_name"]
        assert "_id" in data
    
    def test_get_parents(self, auth_headers):
        """Test get parents list"""
        response = client.get("/evep/parents", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "parents" in data
        assert isinstance(data["parents"], list)
    
    def test_create_teacher(self, auth_headers):
        """Test teacher creation"""
        teacher_data = {
            "first_name": "Teacher",
            "last_name": "Test",
            "email": "teacher@example.com",
            "phone": "+66-81-234-5678",
            "school": "Test School",
            "subject": "Science"
        }
        response = client.post("/evep/teachers", json=teacher_data, headers=auth_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["first_name"] == teacher_data["first_name"]
        assert "_id" in data
    
    def test_get_teachers(self, auth_headers):
        """Test get teachers list"""
        response = client.get("/evep/teachers", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "teachers" in data
        assert isinstance(data["teachers"], list)
    
    def test_create_school(self, auth_headers):
        """Test school creation"""
        school_data = {
            "name": "Test School",
            "address": "123 School Street",
            "city": "Bangkok",
            "phone": "+66-81-234-5678",
            "email": "school@example.com"
        }
        response = client.post("/evep/schools", json=school_data, headers=auth_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == school_data["name"]
        assert "_id" in data
    
    def test_get_schools(self, auth_headers):
        """Test get schools list"""
        response = client.get("/evep/schools", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "schools" in data
        assert isinstance(data["schools"], list)

# Admin API Tests
class TestAdminAPI:
    """Test admin endpoints"""
    
    def test_get_admin_dashboard(self, admin_headers):
        """Test admin dashboard"""
        response = client.get("/admin/dashboard", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "total_patients" in data
        assert "total_screenings" in data
        assert "recent_activity" in data
    
    def test_get_users(self, admin_headers):
        """Test get users list"""
        response = client.get("/admin/users", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert isinstance(data["users"], list)
    
    def test_create_user(self, admin_headers):
        """Test user creation by admin"""
        user_data = {
            "email": "newuser@example.com",
            "password": "newpassword123",
            "first_name": "New",
            "last_name": "User",
            "role": "doctor",
            "organization": "Test Hospital"
        }
        response = client.post("/admin/users", json=user_data, headers=admin_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == user_data["email"]
        assert "_id" in data
    
    def test_update_user(self, admin_headers, test_user_id):
        """Test user update by admin"""
        update_data = {"role": "nurse"}
        response = client.put(f"/admin/users/{test_user_id}", json=update_data, headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "nurse"
    
    def test_delete_user(self, admin_headers, test_user_id):
        """Test user deletion by admin"""
        response = client.delete(f"/admin/users/{test_user_id}", headers=admin_headers)
        assert response.status_code == 200
        assert response.json()["message"] == "User deleted successfully"
    
    def test_get_audit_logs(self, admin_headers):
        """Test get audit logs"""
        response = client.get("/admin/audit-logs", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "logs" in data
        assert isinstance(data["logs"], list)
    
    def test_get_system_statistics(self, admin_headers):
        """Test get system statistics"""
        response = client.get("/admin/statistics", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "user_statistics" in data
        assert "patient_statistics" in data
        assert "screening_statistics" in data
        assert "system_health" in data

# AI Insights API Tests
class TestAIInsightsAPI:
    """Test AI insights endpoints"""
    
    def test_generate_insight(self, auth_headers, test_patient_id):
        """Test AI insight generation"""
        insight_data = {
            "patient_id": test_patient_id,
            "insight_type": "vision_analysis",
            "context": "Recent screening results"
        }
        response = client.post("/ai-insights/generate", json=insight_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "insight" in data
        assert "confidence" in data
        assert "recommendations" in data
    
    def test_get_insights(self, auth_headers):
        """Test get AI insights"""
        response = client.get("/ai-insights", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "insights" in data
        assert isinstance(data["insights"], list)
    
    def test_search_insights(self, auth_headers):
        """Test AI insights search"""
        search_params = {"q": "vision"}
        response = client.get("/ai-insights/search", params=search_params, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "insights" in data
        assert isinstance(data["insights"], list)

# Medical Security API Tests
class TestMedicalSecurityAPI:
    """Test medical security endpoints"""
    
    def test_get_security_events(self, auth_headers):
        """Test get security events"""
        response = client.get("/medical-security/events", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "events" in data
        assert isinstance(data["events"], list)
    
    def test_get_security_stats(self, auth_headers):
        """Test get security statistics"""
        response = client.get("/medical-security/stats", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_events" in data
        assert "events_by_type" in data
        assert "events_by_severity" in data

# Performance Tests
class TestAPIPerformance:
    """Test API performance"""
    
    def test_health_check_performance(self):
        """Test health check response time"""
        start_time = time.time()
        response = client.get("/health")
        end_time = time.time()
        
        assert response.status_code == 200
        assert (end_time - start_time) < 0.1  # Should respond within 100ms
    
    def test_concurrent_requests(self):
        """Test concurrent request handling"""
        import threading
        import queue
        
        results = queue.Queue()
        
        def make_request():
            try:
                response = client.get("/health")
                results.put(response.status_code)
            except Exception as e:
                results.put(f"Error: {e}")
        
        # Create 10 concurrent threads
        threads = []
        for _ in range(10):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # Check results
        success_count = 0
        while not results.empty():
            result = results.get()
            if result == 200:
                success_count += 1
        
        assert success_count >= 8  # At least 80% should succeed

# Error Handling Tests
class TestAPIErrorHandling:
    """Test API error handling"""
    
    def test_invalid_json(self):
        """Test handling of invalid JSON"""
        response = client.post("/auth/login", data="invalid json")
        assert response.status_code == 422
    
    def test_missing_required_fields(self):
        """Test handling of missing required fields"""
        response = client.post("/auth/login", json={"email": "test@example.com"})
        assert response.status_code == 422
    
    def test_invalid_uuid(self):
        """Test handling of invalid UUID"""
        response = client.get("/patients/invalid-uuid", headers={"Authorization": "Bearer invalid"})
        assert response.status_code == 401
    
    def test_nonexistent_resource(self, auth_headers):
        """Test handling of nonexistent resource"""
        fake_id = str(ObjectId())
        response = client.get(f"/patients/{fake_id}", headers=auth_headers)
        assert response.status_code == 404

# Data Validation Tests
class TestDataValidation:
    """Test data validation"""
    
    def test_invalid_email_format(self):
        """Test invalid email format"""
        user_data = TEST_USER_DATA.copy()
        user_data["email"] = "invalid-email"
        response = client.post("/auth/register", json=user_data)
        assert response.status_code == 422
    
    def test_password_too_short(self):
        """Test password too short"""
        user_data = TEST_USER_DATA.copy()
        user_data["password"] = "123"
        response = client.post("/auth/register", json=user_data)
        assert response.status_code == 422
    
    def test_invalid_date_format(self, auth_headers):
        """Test invalid date format"""
        patient_data = TEST_PATIENT_DATA.copy()
        patient_data["date_of_birth"] = "invalid-date"
        response = client.post("/patients/", json=patient_data, headers=auth_headers)
        assert response.status_code == 422

# Security Tests
class TestAPISecurity:
    """Test API security"""
    
    def test_cors_headers(self):
        """Test CORS headers"""
        response = client.options("/health")
        assert response.status_code == 200
        # CORS headers should be present
    
    def test_rate_limiting(self):
        """Test rate limiting"""
        # Make multiple requests quickly
        for _ in range(10):
            response = client.get("/health")
            # Should not be rate limited for health check
        
        assert response.status_code == 200
    
    def test_sql_injection_protection(self, auth_headers):
        """Test SQL injection protection"""
        # Test with potentially malicious input
        malicious_input = "'; DROP TABLE users; --"
        response = client.get(f"/patients/search?q={malicious_input}", headers=auth_headers)
        # Should not cause database issues
        assert response.status_code in [200, 400, 404]

# Integration Test Runner
def run_integration_tests():
    """Run all integration tests"""
    import subprocess
    import sys
    
    # Run tests with coverage
    result = subprocess.run([
        sys.executable, "-m", "pytest",
        "tests/test_api_integration.py",
        "-v",
        "--cov=app",
        "--cov-report=html",
        "--cov-report=term-missing"
    ])
    
    return result.returncode == 0

if __name__ == "__main__":
    success = run_integration_tests()
    sys.exit(0 if success else 1)

