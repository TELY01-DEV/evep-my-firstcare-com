import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
import json

class TestPatientManagement:
    """Test suite for patient management endpoints."""
    
    def test_create_patient_success(self, client, auth_headers, mock_auth_user, sample_patient_data):
        """Test successful patient creation."""
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            response = client.post("/api/v1/patients", 
                                json=sample_patient_data, 
                                headers=auth_headers)
            
            assert response.status_code == 201
            data = response.json()
            assert data["message"] == "Patient created successfully"
            assert "patient_id" in data
            assert data["patient"]["first_name"] == sample_patient_data["first_name"]
            assert data["patient"]["last_name"] == sample_patient_data["last_name"]
            assert data["patient"]["school"] == sample_patient_data["school"]
    
    def test_create_patient_unauthorized(self, client, sample_patient_data):
        """Test patient creation without authentication."""
        response = client.post("/api/v1/patients", json=sample_patient_data)
        assert response.status_code == 401
    
    def test_create_patient_invalid_data(self, client, auth_headers, mock_auth_user):
        """Test patient creation with invalid data."""
        invalid_data = {
            "first_name": "",  # Empty first name
            "last_name": "Doe",
            "date_of_birth": "invalid-date",
            "gender": "invalid-gender"
        }
        
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            response = client.post("/api/v1/patients", 
                                json=invalid_data, 
                                headers=auth_headers)
            
            assert response.status_code == 422
    
    def test_get_patient_success(self, client, auth_headers, mock_auth_user, test_db, sample_patient_data):
        """Test successful patient retrieval."""
        # Create a patient first
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            create_response = client.post("/api/v1/patients", 
                                       json=sample_patient_data, 
                                       headers=auth_headers)
            patient_id = create_response.json()["patient_id"]
            
            # Get the patient
            response = client.get(f"/api/v1/patients/{patient_id}", headers=auth_headers)
            
            assert response.status_code == 200
            data = response.json()
            assert data["first_name"] == sample_patient_data["first_name"]
            assert data["last_name"] == sample_patient_data["last_name"]
            assert data["school"] == sample_patient_data["school"]
    
    def test_get_patient_not_found(self, client, auth_headers, mock_auth_user):
        """Test getting non-existent patient."""
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            response = client.get("/api/v1/patients/nonexistent_id", headers=auth_headers)
            assert response.status_code == 404
    
    def test_get_patient_unauthorized(self, client):
        """Test getting patient without authentication."""
        response = client.get("/api/v1/patients/test_id")
        assert response.status_code == 401
    
    def test_update_patient_success(self, client, auth_headers, mock_auth_user, test_db, sample_patient_data):
        """Test successful patient update."""
        # Create a patient first
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            create_response = client.post("/api/v1/patients", 
                                       json=sample_patient_data, 
                                       headers=auth_headers)
            patient_id = create_response.json()["patient_id"]
            
            # Update the patient
            update_data = {
                "first_name": "Updated",
                "last_name": "Name",
                "grade": "4B"
            }
            
            response = client.put(f"/api/v1/patients/{patient_id}", 
                               json=update_data, 
                               headers=auth_headers)
            
            assert response.status_code == 200
            data = response.json()
            assert data["message"] == "Patient updated successfully"
            assert data["patient"]["first_name"] == update_data["first_name"]
            assert data["patient"]["last_name"] == update_data["last_name"]
            assert data["patient"]["grade"] == update_data["grade"]
    
    def test_update_patient_not_found(self, client, auth_headers, mock_auth_user):
        """Test updating non-existent patient."""
        update_data = {"first_name": "Updated"}
        
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            response = client.put("/api/v1/patients/nonexistent_id", 
                               json=update_data, 
                               headers=auth_headers)
            assert response.status_code == 404
    
    def test_delete_patient_success(self, client, auth_headers, mock_auth_user, test_db, sample_patient_data):
        """Test successful patient deletion."""
        # Create a patient first
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            create_response = client.post("/api/v1/patients", 
                                       json=sample_patient_data, 
                                       headers=auth_headers)
            patient_id = create_response.json()["patient_id"]
            
            # Delete the patient
            response = client.delete(f"/api/v1/patients/{patient_id}", headers=auth_headers)
            
            assert response.status_code == 200
            assert "deleted successfully" in response.json()["message"]
    
    def test_delete_patient_not_found(self, client, auth_headers, mock_auth_user):
        """Test deleting non-existent patient."""
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            response = client.delete("/api/v1/patients/nonexistent_id", headers=auth_headers)
            assert response.status_code == 404
    
    def test_list_patients_success(self, client, auth_headers, mock_auth_user, test_db, sample_patient_data):
        """Test successful patient listing."""
        # Create multiple patients
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            # Create first patient
            client.post("/api/v1/patients", json=sample_patient_data, headers=auth_headers)
            
            # Create second patient
            patient2_data = sample_patient_data.copy()
            patient2_data["first_name"] = "Jane"
            patient2_data["email"] = "jane.doe@example.com"
            client.post("/api/v1/patients", json=patient2_data, headers=auth_headers)
            
            # List patients
            response = client.get("/api/v1/patients", headers=auth_headers)
            
            assert response.status_code == 200
            data = response.json()
            assert "patients" in data
            assert len(data["patients"]) >= 2
            assert "total" in data
            assert data["total"] >= 2
    
    def test_list_patients_with_pagination(self, client, auth_headers, mock_auth_user, test_db, sample_patient_data):
        """Test patient listing with pagination."""
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            # Create multiple patients
            for i in range(5):
                patient_data = sample_patient_data.copy()
                patient_data["first_name"] = f"Patient{i}"
                patient_data["email"] = f"patient{i}@example.com"
                client.post("/api/v1/patients", json=patient_data, headers=auth_headers)
            
            # List patients with pagination
            response = client.get("/api/v1/patients?page=1&limit=3", headers=auth_headers)
            
            assert response.status_code == 200
            data = response.json()
            assert len(data["patients"]) <= 3
            assert "page" in data
            assert "total_pages" in data
    
    def test_search_patients(self, client, auth_headers, mock_auth_user, test_db, sample_patient_data):
        """Test patient search functionality."""
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            # Create a patient
            client.post("/api/v1/patients", json=sample_patient_data, headers=auth_headers)
            
            # Search by name
            response = client.get("/api/v1/patients?search=John", headers=auth_headers)
            
            assert response.status_code == 200
            data = response.json()
            assert len(data["patients"]) >= 1
            assert any("John" in patient["first_name"] for patient in data["patients"])
    
    def test_filter_patients_by_school(self, client, auth_headers, mock_auth_user, test_db, sample_patient_data):
        """Test patient filtering by school."""
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            # Create a patient
            client.post("/api/v1/patients", json=sample_patient_data, headers=auth_headers)
            
            # Filter by school
            response = client.get("/api/v1/patients?school=Test School", headers=auth_headers)
            
            assert response.status_code == 200
            data = response.json()
            assert len(data["patients"]) >= 1
            assert all(patient["school"] == "Test School" for patient in data["patients"])
    
    def test_filter_patients_by_grade(self, client, auth_headers, mock_auth_user, test_db, sample_patient_data):
        """Test patient filtering by grade."""
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            # Create a patient
            client.post("/api/v1/patients", json=sample_patient_data, headers=auth_headers)
            
            # Filter by grade
            response = client.get("/api/v1/patients?grade=3A", headers=auth_headers)
            
            assert response.status_code == 200
            data = response.json()
            assert len(data["patients"]) >= 1
            assert all(patient["grade"] == "3A" for patient in data["patients"])
    
    def test_filter_patients_by_gender(self, client, auth_headers, mock_auth_user, test_db, sample_patient_data):
        """Test patient filtering by gender."""
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            # Create a patient
            client.post("/api/v1/patients", json=sample_patient_data, headers=auth_headers)
            
            # Filter by gender
            response = client.get("/api/v1/patients?gender=male", headers=auth_headers)
            
            assert response.status_code == 200
            data = response.json()
            assert len(data["patients"]) >= 1
            assert all(patient["gender"] == "male" for patient in data["patients"])
    
    def test_validate_patient_data(self, client, auth_headers, mock_auth_user):
        """Test patient data validation."""
        test_cases = [
            # Valid data
            ({
                "first_name": "John",
                "last_name": "Doe",
                "date_of_birth": "2015-03-15",
                "gender": "male",
                "school": "Test School",
                "grade": "3A"
            }, True),
            # Missing required fields
            ({
                "first_name": "John",
                "last_name": "Doe"
            }, False),
            # Invalid date format
            ({
                "first_name": "John",
                "last_name": "Doe",
                "date_of_birth": "invalid-date",
                "gender": "male"
            }, False),
            # Invalid gender
            ({
                "first_name": "John",
                "last_name": "Doe",
                "date_of_birth": "2015-03-15",
                "gender": "invalid"
            }, False),
        ]
        
        for patient_data, should_be_valid in test_cases:
            with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
                response = client.post("/api/v1/patients", 
                                    json=patient_data, 
                                    headers=auth_headers)
                
                if should_be_valid:
                    assert response.status_code == 201, f"Data should be valid: {patient_data}"
                else:
                    assert response.status_code == 422, f"Data should be invalid: {patient_data}"
    
    def test_patient_statistics(self, client, auth_headers, mock_auth_user, test_db, sample_patient_data):
        """Test patient statistics endpoint."""
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            # Create some patients
            for i in range(3):
                patient_data = sample_patient_data.copy()
                patient_data["first_name"] = f"Patient{i}"
                patient_data["email"] = f"patient{i}@example.com"
                client.post("/api/v1/patients", json=patient_data, headers=auth_headers)
            
            # Get statistics
            response = client.get("/api/v1/patients/statistics", headers=auth_headers)
            
            assert response.status_code == 200
            data = response.json()
            assert "total_patients" in data
            assert "by_gender" in data
            assert "by_school" in data
            assert "by_grade" in data
            assert data["total_patients"] >= 3
    
    def test_export_patients(self, client, auth_headers, mock_auth_user, test_db, sample_patient_data):
        """Test patient export functionality."""
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            # Create a patient
            client.post("/api/v1/patients", json=sample_patient_data, headers=auth_headers)
            
            # Export patients
            response = client.get("/api/v1/patients/export", headers=auth_headers)
            
            assert response.status_code == 200
            assert response.headers["content-type"] == "text/csv"
            assert "first_name,last_name,date_of_birth" in response.text
