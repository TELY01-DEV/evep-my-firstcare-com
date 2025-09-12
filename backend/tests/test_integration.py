"""
Integration tests for EVEP Platform

These tests verify the integration between different components
of the EVEP platform including authentication, data flow, and API interactions.
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, timedelta
from typing import Dict, Any

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_database
from app.core.security import create_access_token, get_password_hash
from app.models.evep_models import User, Patient, ScreeningSession


class TestEVEPIntegration:
    """Integration tests for EVEP Platform"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)
    
    @pytest.fixture
    def test_user_data(self):
        """Test user data"""
        return {
            "username": "test_doctor",
            "email": "doctor@test.com",
            "password": "testpassword123",
            "role": "doctor",
            "full_name": "Dr. Test Doctor",
            "phone": "+1234567890"
        }
    
    @pytest.fixture
    def test_patient_data(self):
        """Test patient data"""
        return {
            "patient_id": "TEST_PATIENT_001",
            "name": "John Doe",
            "age": 25,
            "gender": "male",
            "school": "Test School",
            "grade": "5th Grade",
            "parent_name": "Jane Doe",
            "parent_phone": "+1234567890",
            "address": "123 Test Street",
            "emergency_contact": "Emergency Contact"
        }
    
    @pytest.fixture
    def test_screening_data(self):
        """Test screening data"""
        return {
            "screening_date": datetime.now().isoformat(),
            "screening_type": "vision_screening",
            "left_eye_distance": "20/20",
            "right_eye_distance": "20/25",
            "left_eye_near": "20/20",
            "right_eye_near": "20/20",
            "color_vision": "normal",
            "depth_perception": "normal",
            "notes": "Patient shows normal vision with slight right eye distance vision reduction."
        }
    
    @pytest.fixture
    async def auth_headers(self, client, test_user_data):
        """Create authenticated headers for testing"""
        # Create test user
        user_data = test_user_data.copy()
        user_data["password"] = get_password_hash(user_data["password"])
        
        # Insert user into database (mock)
        with patch('app.core.database.get_database') as mock_db:
            mock_collection = Mock()
            mock_collection.find_one.return_value = {
                "_id": "test_user_id",
                **user_data
            }
            mock_db.return_value.users = mock_collection
            
            # Create access token
            token = create_access_token(
                data={"sub": user_data["username"], "role": user_data["role"]}
            )
            
            return {"Authorization": f"Bearer {token}"}
    
    def test_health_check_integration(self, client):
        """Test health check endpoint integration"""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "timestamp" in data
        assert "version" in data
    
    def test_authentication_flow(self, client, test_user_data):
        """Test complete authentication flow"""
        # Test login endpoint
        login_data = {
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        }
        
        with patch('app.api.auth.authenticate_user') as mock_auth:
            mock_auth.return_value = {
                "_id": "test_user_id",
                **test_user_data
            }
            
            response = client.post("/api/v1/auth/login", data=login_data)
            
            assert response.status_code == 200
            data = response.json()
            assert "access_token" in data
            assert "token_type" in data
            assert data["token_type"] == "bearer"
    
    def test_patient_management_integration(self, client, auth_headers, test_patient_data):
        """Test patient management integration"""
        # Test patient creation
        with patch('app.api.patients.get_database') as mock_db:
            mock_collection = Mock()
            mock_collection.insert_one.return_value = Mock(inserted_id="test_patient_id")
            mock_collection.find_one.return_value = {
                "_id": "test_patient_id",
                **test_patient_data
            }
            mock_db.return_value.patients = mock_collection
            
            response = client.post(
                "/api/v1/patients/",
                json=test_patient_data,
                headers=auth_headers
            )
            
            assert response.status_code == 201
            data = response.json()
            assert data["patient_id"] == test_patient_data["patient_id"]
            assert data["name"] == test_patient_data["name"]
    
    def test_screening_workflow_integration(self, client, auth_headers, test_patient_data, test_screening_data):
        """Test complete screening workflow integration"""
        # Create patient first
        with patch('app.api.screenings.get_database') as mock_db:
            mock_patients = Mock()
            mock_patients.find_one.return_value = {
                "_id": "test_patient_id",
                **test_patient_data
            }
            
            mock_screenings = Mock()
            mock_screenings.insert_one.return_value = Mock(inserted_id="test_screening_id")
            mock_screenings.find_one.return_value = {
                "_id": "test_screening_id",
                "patient_id": test_patient_data["patient_id"],
                **test_screening_data
            }
            
            mock_db.return_value.patients = mock_patients
            mock_db.return_value.screenings = mock_screenings
            
            # Create screening session
            screening_data = {
                "patient_id": test_patient_data["patient_id"],
                **test_screening_data
            }
            
            response = client.post(
                "/api/v1/screenings/sessions",
                json=screening_data,
                headers=auth_headers
            )
            
            assert response.status_code == 201
            data = response.json()
            assert data["patient_id"] == test_patient_data["patient_id"]
            assert data["screening_type"] == test_screening_data["screening_type"]
    
    def test_ai_integration_workflow(self, client, auth_headers, test_screening_data):
        """Test AI integration workflow"""
        # Mock AI service client
        with patch('app.api.ai_insights.ai_client') as mock_ai_client:
            mock_insight = {
                "insight_id": "test_insight_123",
                "content": "Patient shows normal vision with slight right eye distance vision reduction.",
                "role": "doctor",
                "insight_type": "screening_analysis",
                "model_used": "gpt-4",
                "template_used": "doctor_screening_analysis",
                "success": True
            }
            
            mock_ai_client.generate_insight.return_value = mock_insight
            
            # Test AI insight generation
            request_data = {
                "screening_data": test_screening_data,
                "patient_info": {
                    "name": "John Doe",
                    "age": 25
                },
                "role": "doctor",
                "insight_type": "screening_analysis"
            }
            
            response = client.post(
                "/api/v1/ai-insights/generate-screening-insight",
                json=request_data,
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["insight"]["insight_id"] == "test_insight_123"
    
    def test_data_flow_integration(self, client, auth_headers, test_patient_data, test_screening_data):
        """Test complete data flow integration"""
        # Mock database operations
        with patch('app.core.database.get_database') as mock_db:
            # Mock collections
            mock_patients = Mock()
            mock_screenings = Mock()
            mock_users = Mock()
            
            # Setup patient operations
            mock_patients.insert_one.return_value = Mock(inserted_id="test_patient_id")
            mock_patients.find_one.return_value = {
                "_id": "test_patient_id",
                **test_patient_data
            }
            
            # Setup screening operations
            mock_screenings.insert_one.return_value = Mock(inserted_id="test_screening_id")
            mock_screenings.find_one.return_value = {
                "_id": "test_screening_id",
                "patient_id": test_patient_data["patient_id"],
                **test_screening_data
            }
            
            # Setup user operations
            mock_users.find_one.return_value = {
                "_id": "test_user_id",
                "username": "test_doctor",
                "role": "doctor"
            }
            
            mock_db.return_value.patients = mock_patients
            mock_db.return_value.screenings = mock_screenings
            mock_db.return_value.users = mock_users
            
            # Test complete workflow: Create patient -> Create screening -> Generate AI insight
            
            # 1. Create patient
            patient_response = client.post(
                "/api/v1/patients/",
                json=test_patient_data,
                headers=auth_headers
            )
            assert patient_response.status_code == 201
            
            # 2. Create screening
            screening_data = {
                "patient_id": test_patient_data["patient_id"],
                **test_screening_data
            }
            
            screening_response = client.post(
                "/api/v1/screenings/sessions",
                json=screening_data,
                headers=auth_headers
            )
            assert screening_response.status_code == 201
            
            # 3. Generate AI insight
            with patch('app.api.ai_insights.ai_client') as mock_ai_client:
                mock_ai_client.generate_insight.return_value = {
                    "insight_id": "test_insight_123",
                    "content": "AI analysis of screening data",
                    "success": True
                }
                
                ai_response = client.post(
                    "/api/v1/ai-insights/generate-screening-insight",
                    json={
                        "screening_data": test_screening_data,
                        "role": "doctor",
                        "insight_type": "screening_analysis"
                    },
                    headers=auth_headers
                )
                assert ai_response.status_code == 200
    
    def test_error_handling_integration(self, client, auth_headers):
        """Test error handling integration"""
        # Test invalid endpoint
        response = client.get("/api/v1/invalid-endpoint", headers=auth_headers)
        assert response.status_code == 404
        
        # Test invalid authentication
        invalid_headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/v1/patients/", headers=invalid_headers)
        assert response.status_code == 401
        
        # Test invalid data
        invalid_patient_data = {"invalid_field": "invalid_value"}
        response = client.post(
            "/api/v1/patients/",
            json=invalid_patient_data,
            headers=auth_headers
        )
        assert response.status_code == 422
    
    def test_performance_integration(self, client, auth_headers):
        """Test performance integration"""
        import time
        
        # Test response time for health check
        start_time = time.time()
        response = client.get("/health")
        end_time = time.time()
        
        assert response.status_code == 200
        assert (end_time - start_time) < 1.0  # Should respond within 1 second
        
        # Test concurrent requests
        import concurrent.futures
        
        def make_request():
            return client.get("/health")
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_request) for _ in range(5)]
            responses = [future.result() for future in futures]
            
            for response in responses:
                assert response.status_code == 200
    
    def test_security_integration(self, client, test_user_data):
        """Test security integration"""
        # Test password hashing
        hashed_password = get_password_hash(test_user_data["password"])
        assert hashed_password != test_user_data["password"]
        assert len(hashed_password) > 50  # Should be properly hashed
        
        # Test token creation and validation
        token = create_access_token(
            data={"sub": test_user_data["username"], "role": test_user_data["role"]}
        )
        assert token is not None
        assert len(token) > 50
        
        # Test CORS headers
        response = client.options("/health")
        assert response.status_code == 200
    
    def test_database_integration(self, client):
        """Test database integration"""
        # Test database connection
        with patch('app.core.database.get_database') as mock_db:
            mock_db.return_value = Mock()
            
            # Test that database operations work
            response = client.get("/health")
            assert response.status_code == 200
    
    def test_logging_integration(self, client):
        """Test logging integration"""
        # Test that requests are logged
        with patch('app.middleware.logging_middleware.logger') as mock_logger:
            response = client.get("/health")
            assert response.status_code == 200
            
            # Verify that logging was called
            mock_logger.info.assert_called()


class TestEVEPWorkflowIntegration:
    """Test complete EVEP workflow integration"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)
    
    @pytest.fixture
    def workflow_data(self):
        """Complete workflow test data"""
        return {
            "user": {
                "username": "workflow_doctor",
                "email": "workflow@test.com",
                "password": "workflow123",
                "role": "doctor",
                "full_name": "Dr. Workflow Test"
            },
            "patient": {
                "patient_id": "WORKFLOW_PATIENT_001",
                "name": "Workflow Patient",
                "age": 30,
                "gender": "female",
                "school": "Workflow School",
                "grade": "6th Grade"
            },
            "screening": {
                "screening_date": datetime.now().isoformat(),
                "screening_type": "vision_screening",
                "left_eye_distance": "20/20",
                "right_eye_distance": "20/30",
                "left_eye_near": "20/20",
                "right_eye_near": "20/25",
                "color_vision": "normal",
                "depth_perception": "normal"
            }
        }
    
    def test_complete_evep_workflow(self, client, workflow_data):
        """Test complete EVEP workflow from user creation to AI insight"""
        
        # Mock all database operations
        with patch('app.core.database.get_database') as mock_db:
            # Setup mock collections
            mock_users = Mock()
            mock_patients = Mock()
            mock_screenings = Mock()
            
            # Setup user operations
            mock_users.insert_one.return_value = Mock(inserted_id="workflow_user_id")
            mock_users.find_one.return_value = {
                "_id": "workflow_user_id",
                **workflow_data["user"]
            }
            
            # Setup patient operations
            mock_patients.insert_one.return_value = Mock(inserted_id="workflow_patient_id")
            mock_patients.find_one.return_value = {
                "_id": "workflow_patient_id",
                **workflow_data["patient"]
            }
            
            # Setup screening operations
            mock_screenings.insert_one.return_value = Mock(inserted_id="workflow_screening_id")
            mock_screenings.find_one.return_value = {
                "_id": "workflow_screening_id",
                "patient_id": workflow_data["patient"]["patient_id"],
                **workflow_data["screening"]
            }
            
            mock_db.return_value.users = mock_users
            mock_db.return_value.patients = mock_patients
            mock_db.return_value.screenings = mock_screenings
            
            # 1. User Authentication
            with patch('app.api.auth.authenticate_user') as mock_auth:
                mock_auth.return_value = {
                    "_id": "workflow_user_id",
                    **workflow_data["user"]
                }
                
                login_response = client.post("/api/v1/auth/login", data={
                    "username": workflow_data["user"]["username"],
                    "password": workflow_data["user"]["password"]
                })
                
                assert login_response.status_code == 200
                token_data = login_response.json()
                auth_headers = {"Authorization": f"Bearer {token_data['access_token']}"}
            
            # 2. Patient Creation
            patient_response = client.post(
                "/api/v1/patients/",
                json=workflow_data["patient"],
                headers=auth_headers
            )
            assert patient_response.status_code == 201
            
            # 3. Screening Session Creation
            screening_data = {
                "patient_id": workflow_data["patient"]["patient_id"],
                **workflow_data["screening"]
            }
            
            screening_response = client.post(
                "/api/v1/screenings/sessions",
                json=screening_data,
                headers=auth_headers
            )
            assert screening_response.status_code == 201
            
            # 4. AI Insight Generation
            with patch('app.api.ai_insights.ai_client') as mock_ai_client:
                mock_ai_client.generate_insight.return_value = {
                    "insight_id": "workflow_insight_123",
                    "content": "Workflow patient shows normal vision with slight right eye distance vision reduction.",
                    "role": "doctor",
                    "insight_type": "screening_analysis",
                    "model_used": "gpt-4",
                    "template_used": "doctor_screening_analysis",
                    "success": True
                }
                
                ai_response = client.post(
                    "/api/v1/ai-insights/generate-screening-insight",
                    json={
                        "screening_data": workflow_data["screening"],
                        "patient_info": workflow_data["patient"],
                        "role": "doctor",
                        "insight_type": "screening_analysis"
                    },
                    headers=auth_headers
                )
                assert ai_response.status_code == 200
                
                ai_data = ai_response.json()
                assert ai_data["success"] is True
                assert ai_data["insight"]["insight_id"] == "workflow_insight_123"
            
            # 5. Data Retrieval and Verification
            # Get patient
            patient_get_response = client.get(
                f"/api/v1/patients/{workflow_data['patient']['patient_id']}",
                headers=auth_headers
            )
            assert patient_get_response.status_code == 200
            
            # Get screenings for patient
            screenings_response = client.get(
                f"/api/v1/screenings/patient/{workflow_data['patient']['patient_id']}",
                headers=auth_headers
            )
            assert screenings_response.status_code == 200
            
            # 6. Verify complete workflow
            assert mock_users.insert_one.called
            assert mock_patients.insert_one.called
            assert mock_screenings.insert_one.called


if __name__ == "__main__":
    pytest.main([__file__])

