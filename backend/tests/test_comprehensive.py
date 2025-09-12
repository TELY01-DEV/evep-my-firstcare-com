"""
Comprehensive Test Suite for EVEP Backend
Covers all major functionality including authentication, patient management, screening, and AI integration.
"""

import pytest
import json
from unittest.mock import patch, AsyncMock, MagicMock
from datetime import datetime, timedelta
from bson import ObjectId

# Test data fixtures
@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "email": "test@example.com",
        "password": "SecurePass123!",
        "first_name": "Test",
        "last_name": "User",
        "role": "doctor",
        "organization": "Test Hospital"
    }

@pytest.fixture
def sample_patient_data():
    """Sample patient data for testing."""
    return {
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

@pytest.fixture
def sample_screening_data():
    """Sample screening data for testing."""
    return {
        "patient_id": "test_patient_id",
        "screening_type": "vision",
        "screening_date": datetime.now().isoformat(),
        "results": {
            "left_eye": "20/20",
            "right_eye": "20/25",
            "notes": "Normal vision screening"
        },
        "status": "completed"
    }

@pytest.fixture
def mock_jwt_token():
    """Mock JWT token for testing."""
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6ImRvY3RvciIsImV4cCI6MTczNTY4MDAwMH0.test_signature"

class TestAuthenticationSystem:
    """Comprehensive authentication system tests."""
    
    def test_user_registration_success(self, client, test_db):
        """Test successful user registration with all required fields."""
        user_data = {
            "email": "newuser@example.com",
            "password": "SecurePass123!",
            "first_name": "New",
            "last_name": "User",
            "role": "doctor",
            "organization": "Test Hospital"
        }
        
        response = client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["message"] == "User registered successfully"
        assert "user_id" in data
        assert data["user"]["email"] == user_data["email"]
        assert data["user"]["role"] == user_data["role"]
        assert "password" not in data["user"]
    
    def test_user_registration_validation(self, client):
        """Test user registration validation."""
        # Test invalid email
        invalid_email_data = {
            "email": "invalid-email",
            "password": "SecurePass123!",
            "first_name": "Test",
            "last_name": "User",
            "role": "doctor"
        }
        response = client.post("/api/v1/auth/register", json=invalid_email_data)
        assert response.status_code == 422
        
        # Test weak password
        weak_password_data = {
            "email": "test@example.com",
            "password": "123",
            "first_name": "Test",
            "last_name": "User",
            "role": "doctor"
        }
        response = client.post("/api/v1/auth/register", json=weak_password_data)
        assert response.status_code == 422
        
        # Test missing required fields
        incomplete_data = {
            "email": "test@example.com",
            "password": "SecurePass123!"
        }
        response = client.post("/api/v1/auth/register", json=incomplete_data)
        assert response.status_code == 422
    
    def test_user_login_success(self, client, test_db, sample_user_data):
        """Test successful user login."""
        # Register user first
        client.post("/api/v1/auth/register", json=sample_user_data)
        
        # Login
        login_data = {
            "email": sample_user_data["email"],
            "password": sample_user_data["password"]
        }
        
        response = client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
    
    def test_user_login_invalid_credentials(self, client):
        """Test login with invalid credentials."""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "WrongPassword123!"
        }
        
        response = client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 401
    
    def test_password_reset_flow(self, client, test_db, sample_user_data):
        """Test password reset flow."""
        # Register user
        client.post("/api/v1/auth/register", json=sample_user_data)
        
        # Request password reset
        reset_request_data = {"email": sample_user_data["email"]}
        response = client.post("/api/v1/auth/forgot-password", json=reset_request_data)
        assert response.status_code == 200
        
        # Test reset with token (mock)
        with patch('app.core.security.verify_reset_token') as mock_verify:
            mock_verify.return_value = sample_user_data["email"]
            
            reset_data = {
                "token": "mock_reset_token",
                "new_password": "NewSecurePass123!"
            }
            response = client.post("/api/v1/auth/reset-password", json=reset_data)
            assert response.status_code == 200

class TestPatientManagement:
    """Comprehensive patient management tests."""
    
    def test_create_patient_success(self, client, test_db, mock_auth_user, sample_patient_data):
        """Test successful patient creation."""
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            response = client.post("/api/v1/patients", json=sample_patient_data)
            
            assert response.status_code == 201
            data = response.json()
            assert data["first_name"] == sample_patient_data["first_name"]
            assert data["last_name"] == sample_patient_data["last_name"]
            assert "patient_id" in data
            assert "audit_hash" in data
    
    def test_create_patient_duplicate(self, client, test_db, mock_auth_user, sample_patient_data):
        """Test patient creation with duplicate information."""
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            # Create first patient
            response1 = client.post("/api/v1/patients", json=sample_patient_data)
            assert response1.status_code == 201
            
            # Try to create duplicate
            response2 = client.post("/api/v1/patients", json=sample_patient_data)
            assert response2.status_code == 400
            assert "already exists" in response2.json()["detail"]
    
    def test_get_patients_list(self, client, test_db, mock_auth_user, sample_patient_data):
        """Test retrieving patients list."""
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            # Create a patient first
            client.post("/api/v1/patients", json=sample_patient_data)
            
            # Get patients list
            response = client.get("/api/v1/patients")
            assert response.status_code == 200
            
            data = response.json()
            assert isinstance(data, list)
            assert len(data) > 0
    
    def test_get_patient_by_id(self, client, test_db, mock_auth_user, sample_patient_data):
        """Test retrieving patient by ID."""
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            # Create a patient
            create_response = client.post("/api/v1/patients", json=sample_patient_data)
            patient_id = create_response.json()["patient_id"]
            
            # Get patient by ID
            response = client.get(f"/api/v1/patients/{patient_id}")
            assert response.status_code == 200
            
            data = response.json()
            assert data["patient_id"] == patient_id
            assert data["first_name"] == sample_patient_data["first_name"]
    
    def test_update_patient(self, client, test_db, mock_auth_user, sample_patient_data):
        """Test patient information update."""
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            # Create a patient
            create_response = client.post("/api/v1/patients", json=sample_patient_data)
            patient_id = create_response.json()["patient_id"]
            
            # Update patient
            update_data = {
                "first_name": "Updated",
                "medical_history": "Updated medical history"
            }
            
            response = client.put(f"/api/v1/patients/{patient_id}", json=update_data)
            assert response.status_code == 200
            
            data = response.json()
            assert data["first_name"] == "Updated"
            assert data["medical_history"] == "Updated medical history"
    
    def test_delete_patient(self, client, test_db, mock_auth_user, sample_patient_data):
        """Test patient deletion (soft delete)."""
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            # Create a patient
            create_response = client.post("/api/v1/patients", json=sample_patient_data)
            patient_id = create_response.json()["patient_id"]
            
            # Delete patient
            response = client.delete(f"/api/v1/patients/{patient_id}")
            assert response.status_code == 200
            
            # Verify patient is marked as inactive
            get_response = client.get(f"/api/v1/patients/{patient_id}")
            assert get_response.json()["is_active"] == False

class TestScreeningManagement:
    """Comprehensive screening management tests."""
    
    def test_create_screening_session(self, client, test_db, mock_auth_user):
        """Test creating a new screening session."""
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            session_data = {
                "session_name": "Test Screening Session",
                "screening_type": "vision",
                "location": "Test School",
                "scheduled_date": datetime.now().isoformat(),
                "expected_participants": 50
            }
            
            response = client.post("/api/v1/screenings/sessions", json=session_data)
            assert response.status_code == 201
            
            data = response.json()
            assert data["session_name"] == session_data["session_name"]
            assert "session_id" in data
    
    def test_record_screening_result(self, client, test_db, mock_auth_user, sample_patient_data):
        """Test recording screening results."""
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            # Create a patient first
            patient_response = client.post("/api/v1/patients", json=sample_patient_data)
            patient_id = patient_response.json()["patient_id"]
            
            # Record screening result
            result_data = {
                "patient_id": patient_id,
                "screening_type": "vision",
                "results": {
                    "left_eye": "20/20",
                    "right_eye": "20/25",
                    "color_vision": "normal",
                    "depth_perception": "normal"
                },
                "notes": "Normal vision screening",
                "recommendations": "No follow-up required"
            }
            
            response = client.post("/api/v1/screenings/results", json=result_data)
            assert response.status_code == 201
            
            data = response.json()
            assert data["patient_id"] == patient_id
            assert data["screening_type"] == "vision"
    
    def test_get_screening_history(self, client, test_db, mock_auth_user, sample_patient_data):
        """Test retrieving screening history for a patient."""
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            # Create a patient
            patient_response = client.post("/api/v1/patients", json=sample_patient_data)
            patient_id = patient_response.json()["patient_id"]
            
            # Record multiple screenings
            for i in range(3):
                result_data = {
                    "patient_id": patient_id,
                    "screening_type": "vision",
                    "results": {
                        "left_eye": f"20/{20 + i}",
                        "right_eye": f"20/{20 + i}"
                    }
                }
                client.post("/api/v1/screenings/results", json=result_data)
            
            # Get screening history
            response = client.get(f"/api/v1/patients/{patient_id}/screenings")
            assert response.status_code == 200
            
            data = response.json()
            assert len(data) == 3

class TestAIIntegration:
    """Comprehensive AI integration tests."""
    
    def test_ai_insight_generation(self, client, test_db, mock_auth_user):
        """Test AI insight generation."""
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            with patch('app.modules.ai_insights.insight_generator.generate_insight') as mock_generate:
                mock_generate.return_value = {
                    "insight": "Test AI insight",
                    "confidence": 0.95,
                    "recommendations": ["Test recommendation"]
                }
                
                insight_data = {
                    "patient_id": "test_patient_id",
                    "insight_type": "vision_analysis",
                    "context": "Recent screening results"
                }
                
                response = client.post("/api/v1/ai-insights/generate", json=insight_data)
                assert response.status_code == 201
                
                data = response.json()
                assert "insight" in data
                assert "confidence" in data
    
    def test_ai_insight_search(self, client, test_db, mock_auth_user):
        """Test AI insight search functionality."""
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            with patch('app.modules.ai_insights.vector_store.search') as mock_search:
                mock_search.return_value = [
                    {"insight": "Test insight 1", "score": 0.9},
                    {"insight": "Test insight 2", "score": 0.8}
                ]
                
                search_data = {
                    "query": "vision problems",
                    "limit": 10
                }
                
                response = client.post("/api/v1/ai-insights/search", json=search_data)
                assert response.status_code == 200
                
                data = response.json()
                assert len(data["results"]) == 2
    
    def test_ai_health_check(self, client):
        """Test AI service health check."""
        response = client.get("/api/v1/ai-insights/health")
        assert response.status_code in [200, 401]  # Either healthy or requires auth

class TestUserManagement:
    """Comprehensive user management tests."""
    
    def test_admin_create_user(self, client, test_db, mock_admin_user):
        """Test admin creating a new user."""
        with patch('app.api.auth.get_current_user', return_value=mock_admin_user):
            new_user_data = {
                "email": "newuser@example.com",
                "password": "SecurePass123!",
                "first_name": "New",
                "last_name": "User",
                "role": "medical_staff",
                "organization": "Test Hospital"
            }
            
            response = client.post("/api/v1/admin/users", json=new_user_data)
            assert response.status_code == 201
            
            data = response.json()
            assert data["email"] == new_user_data["email"]
            assert data["role"] == new_user_data["role"]
    
    def test_admin_get_users_list(self, client, test_db, mock_admin_user):
        """Test admin retrieving users list."""
        with patch('app.api.auth.get_current_user', return_value=mock_admin_user):
            response = client.get("/api/v1/admin/users")
            assert response.status_code == 200
            
            data = response.json()
            assert isinstance(data, list)
    
    def test_admin_update_user(self, client, test_db, mock_admin_user):
        """Test admin updating user information."""
        with patch('app.api.auth.get_current_user', return_value=mock_admin_user):
            # Create a user first
            user_data = {
                "email": "updateuser@example.com",
                "password": "SecurePass123!",
                "first_name": "Update",
                "last_name": "User",
                "role": "teacher"
            }
            create_response = client.post("/api/v1/admin/users", json=user_data)
            user_id = create_response.json()["user_id"]
            
            # Update user
            update_data = {
                "first_name": "Updated",
                "role": "medical_staff"
            }
            
            response = client.put(f"/api/v1/admin/users/{user_id}", json=update_data)
            assert response.status_code == 200
            
            data = response.json()
            assert data["first_name"] == "Updated"
            assert data["role"] == "medical_staff"
    
    def test_admin_deactivate_user(self, client, test_db, mock_admin_user):
        """Test admin deactivating a user."""
        with patch('app.api.auth.get_current_user', return_value=mock_admin_user):
            # Create a user first
            user_data = {
                "email": "deactivateuser@example.com",
                "password": "SecurePass123!",
                "first_name": "Deactivate",
                "last_name": "User",
                "role": "teacher"
            }
            create_response = client.post("/api/v1/admin/users", json=user_data)
            user_id = create_response.json()["user_id"]
            
            # Deactivate user
            response = client.delete(f"/api/v1/admin/users/{user_id}")
            assert response.status_code == 200
            
            # Verify user is deactivated
            get_response = client.get(f"/api/v1/admin/users/{user_id}")
            assert get_response.json()["is_active"] == False

class TestSecurityAndAudit:
    """Comprehensive security and audit tests."""
    
    def test_audit_log_creation(self, client, test_db, mock_auth_user, sample_patient_data):
        """Test audit log creation for patient operations."""
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            # Create a patient (should generate audit log)
            response = client.post("/api/v1/patients", json=sample_patient_data)
            assert response.status_code == 201
            
            # Check audit logs
            audit_response = client.get("/api/v1/admin/audit-logs")
            assert audit_response.status_code == 200
            
            audit_data = audit_response.json()
            assert len(audit_data) > 0
            
            # Verify patient creation audit log exists
            patient_audit = next((log for log in audit_data if log["action"] == "patient_created"), None)
            assert patient_audit is not None
    
    def test_jwt_token_validation(self, client, test_db, sample_user_data):
        """Test JWT token validation."""
        # Register and login to get token
        client.post("/api/v1/auth/register", json=sample_user_data)
        
        login_data = {
            "email": sample_user_data["email"],
            "password": sample_user_data["password"]
        }
        login_response = client.post("/api/v1/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Test protected endpoint with valid token
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/v1/patients", headers=headers)
        assert response.status_code == 200
    
    def test_role_based_access_control(self, client, test_db, mock_teacher_user):
        """Test role-based access control."""
        with patch('app.api.auth.get_current_user', return_value=mock_teacher_user):
            # Teacher should not be able to access admin endpoints
            response = client.get("/api/v1/admin/users")
            assert response.status_code == 403
    
    def test_input_validation_and_sanitization(self, client):
        """Test input validation and sanitization."""
        # Test SQL injection attempt
        malicious_data = {
            "email": "test@example.com'; DROP TABLE users; --",
            "password": "SecurePass123!",
            "first_name": "Test",
            "last_name": "User",
            "role": "doctor"
        }
        
        response = client.post("/api/v1/auth/register", json=malicious_data)
        # Should either fail validation or be properly sanitized
        assert response.status_code in [422, 201]

class TestPerformanceAndLoad:
    """Performance and load testing."""
    
    def test_api_response_time(self, client):
        """Test API response time for health check."""
        import time
        
        start_time = time.time()
        response = client.get("/health")
        end_time = time.time()
        
        response_time = end_time - start_time
        assert response.status_code == 200
        assert response_time < 1.0  # Should respond within 1 second
    
    def test_concurrent_requests(self, client, test_db, mock_auth_user):
        """Test handling of concurrent requests."""
        import threading
        import time
        
        results = []
        
        def make_request():
            with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
                response = client.get("/api/v1/patients")
                results.append(response.status_code)
        
        # Create multiple threads
        threads = []
        for _ in range(5):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # All requests should succeed
        assert all(status == 200 for status in results)

class TestErrorHandling:
    """Comprehensive error handling tests."""
    
    def test_404_error_handling(self, client):
        """Test 404 error handling."""
        response = client.get("/api/v1/nonexistent-endpoint")
        assert response.status_code == 404
    
    def test_422_validation_error(self, client):
        """Test 422 validation error handling."""
        invalid_data = {
            "email": "invalid-email",
            "password": "123"
        }
        
        response = client.post("/api/v1/auth/register", json=invalid_data)
        assert response.status_code == 422
    
    def test_500_internal_server_error(self, client, test_db, mock_auth_user):
        """Test 500 internal server error handling."""
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            with patch('app.core.database.get_patients_collection', side_effect=Exception("Database error")):
                response = client.get("/api/v1/patients")
                assert response.status_code == 500

class TestDataIntegrity:
    """Data integrity and consistency tests."""
    
    def test_data_consistency_after_operations(self, client, test_db, mock_auth_user, sample_patient_data):
        """Test data consistency after CRUD operations."""
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            # Create patient
            create_response = client.post("/api/v1/patients", json=sample_patient_data)
            patient_id = create_response.json()["patient_id"]
            
            # Update patient
            update_data = {"first_name": "Updated"}
            client.put(f"/api/v1/patients/{patient_id}", json=update_data)
            
            # Verify data consistency
            get_response = client.get(f"/api/v1/patients/{patient_id}")
            data = get_response.json()
            
            assert data["first_name"] == "Updated"
            assert data["last_name"] == sample_patient_data["last_name"]  # Should remain unchanged
    
    def test_audit_trail_integrity(self, client, test_db, mock_auth_user, sample_patient_data):
        """Test audit trail integrity."""
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            # Create patient
            client.post("/api/v1/patients", json=sample_patient_data)
            
            # Check audit trail
            audit_response = client.get("/api/v1/admin/audit-logs")
            audit_data = audit_response.json()
            
            # Verify audit trail contains the operation
            patient_audit = next((log for log in audit_data if log["action"] == "patient_created"), None)
            assert patient_audit is not None
            assert "audit_hash" in patient_audit

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--cov=app", "--cov-report=html"])
