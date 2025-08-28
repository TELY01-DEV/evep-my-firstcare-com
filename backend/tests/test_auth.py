import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
import json

class TestAuthentication:
    """Test suite for authentication endpoints."""
    
    def test_register_success(self, client, test_db):
        """Test successful user registration."""
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
    
    def test_register_duplicate_email(self, client, test_db):
        """Test registration with duplicate email."""
        user_data = {
            "email": "duplicate@example.com",
            "password": "SecurePass123!",
            "first_name": "First",
            "last_name": "User",
            "role": "doctor"
        }
        
        # Register first user
        response1 = client.post("/api/v1/auth/register", json=user_data)
        assert response1.status_code == 201
        
        # Try to register with same email
        response2 = client.post("/api/v1/auth/register", json=user_data)
        assert response2.status_code == 400
        assert "already exists" in response2.json()["detail"]
    
    def test_register_invalid_email(self, client):
        """Test registration with invalid email format."""
        user_data = {
            "email": "invalid-email",
            "password": "SecurePass123!",
            "first_name": "Test",
            "last_name": "User",
            "role": "doctor"
        }
        
        response = client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == 422
    
    def test_register_weak_password(self, client):
        """Test registration with weak password."""
        user_data = {
            "email": "test@example.com",
            "password": "123",
            "first_name": "Test",
            "last_name": "User",
            "role": "doctor"
        }
        
        response = client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == 422
    
    def test_login_success(self, client, test_db):
        """Test successful login."""
        # First register a user
        user_data = {
            "email": "login@example.com",
            "password": "SecurePass123!",
            "first_name": "Login",
            "last_name": "User",
            "role": "doctor"
        }
        client.post("/api/v1/auth/register", json=user_data)
        
        # Then login
        login_data = {
            "email": "login@example.com",
            "password": "SecurePass123!"
        }
        
        response = client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["email"] == login_data["email"]
    
    def test_login_invalid_credentials(self, client):
        """Test login with invalid credentials."""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "WrongPassword123!"
        }
        
        response = client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]
    
    def test_login_wrong_password(self, client, test_db):
        """Test login with wrong password."""
        # First register a user
        user_data = {
            "email": "wrongpass@example.com",
            "password": "SecurePass123!",
            "first_name": "Test",
            "last_name": "User",
            "role": "doctor"
        }
        client.post("/api/v1/auth/register", json=user_data)
        
        # Try to login with wrong password
        login_data = {
            "email": "wrongpass@example.com",
            "password": "WrongPassword123!"
        }
        
        response = client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]
    
    def test_get_profile(self, client, auth_headers, mock_auth_user):
        """Test getting user profile."""
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            response = client.get("/api/v1/auth/profile", headers=auth_headers)
            
            assert response.status_code == 200
            data = response.json()
            assert data["email"] == mock_auth_user["email"]
            assert data["role"] == mock_auth_user["role"]
            assert "password" not in data
    
    def test_get_profile_unauthorized(self, client):
        """Test getting profile without authentication."""
        response = client.get("/api/v1/auth/profile")
        assert response.status_code == 401
    
    def test_update_profile(self, client, auth_headers, mock_auth_user):
        """Test updating user profile."""
        update_data = {
            "first_name": "Updated",
            "last_name": "Name",
            "phone": "+66-999-888-777"
        }
        
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            response = client.put("/api/v1/auth/profile", 
                                json=update_data, 
                                headers=auth_headers)
            
            assert response.status_code == 200
            data = response.json()
            assert data["first_name"] == update_data["first_name"]
            assert data["last_name"] == update_data["last_name"]
            assert data["phone"] == update_data["phone"]
    
    def test_change_password(self, client, auth_headers, mock_auth_user):
        """Test changing password."""
        password_data = {
            "current_password": "OldPassword123!",
            "new_password": "NewPassword123!"
        }
        
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            response = client.put("/api/v1/auth/change-password", 
                                json=password_data, 
                                headers=auth_headers)
            
            assert response.status_code == 200
            assert "Password changed successfully" in response.json()["message"]
    
    def test_change_password_wrong_current(self, client, auth_headers, mock_auth_user):
        """Test changing password with wrong current password."""
        password_data = {
            "current_password": "WrongPassword123!",
            "new_password": "NewPassword123!"
        }
        
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            response = client.put("/api/v1/auth/change-password", 
                                json=password_data, 
                                headers=auth_headers)
            
            assert response.status_code == 400
            assert "Current password is incorrect" in response.json()["detail"]
    
    def test_refresh_token(self, client, auth_headers):
        """Test refreshing access token."""
        with patch('app.api.auth.get_current_user') as mock_get_user:
            mock_get_user.return_value = {
                "user_id": "test_user_123",
                "email": "test@example.com",
                "role": "doctor"
            }
            
            response = client.post("/api/v1/auth/refresh", headers=auth_headers)
            
            assert response.status_code == 200
            data = response.json()
            assert "access_token" in data
            assert "token_type" in data
    
    def test_logout(self, client, auth_headers):
        """Test user logout."""
        response = client.post("/api/v1/auth/logout", headers=auth_headers)
        
        assert response.status_code == 200
        assert "Logged out successfully" in response.json()["message"]
    
    def test_account_locking(self, client, test_db):
        """Test account locking after multiple failed login attempts."""
        # Register a user
        user_data = {
            "email": "locktest@example.com",
            "password": "SecurePass123!",
            "first_name": "Lock",
            "last_name": "Test",
            "role": "doctor"
        }
        client.post("/api/v1/auth/register", json=user_data)
        
        # Try to login with wrong password multiple times
        login_data = {
            "email": "locktest@example.com",
            "password": "WrongPassword123!"
        }
        
        # Attempt multiple failed logins
        for _ in range(5):
            response = client.post("/api/v1/auth/login", json=login_data)
            assert response.status_code == 401
        
        # Try one more time - should be locked
        response = client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 423  # Locked
        assert "account is temporarily locked" in response.json()["detail"]
    
    def test_role_based_access(self, client, admin_headers, teacher_headers, parent_headers):
        """Test role-based access control."""
        # Test admin access
        with patch('app.api.auth.get_current_user') as mock_get_user:
            mock_get_user.return_value = {
                "user_id": "admin_user_123",
                "email": "admin@example.com",
                "role": "admin"
            }
            
            response = client.get("/api/v1/admin/users", headers=admin_headers)
            # Should be accessible to admin
            assert response.status_code in [200, 404]  # 404 if no users exist
    
    def test_password_validation(self, client):
        """Test password validation rules."""
        test_cases = [
            ("weak", False),  # Too short
            ("12345678", False),  # No special chars
            ("abcdefgh", False),  # No numbers
            ("ABCDEFGH", False),  # No lowercase
            ("SecurePass123!", True),  # Valid password
            ("MyP@ssw0rd", True),  # Valid password
        ]
        
        for password, should_be_valid in test_cases:
            user_data = {
                "email": f"test{password}@example.com",
                "password": password,
                "first_name": "Test",
                "last_name": "User",
                "role": "doctor"
            }
            
            response = client.post("/api/v1/auth/register", json=user_data)
            
            if should_be_valid:
                assert response.status_code == 201, f"Password '{password}' should be valid"
            else:
                assert response.status_code == 422, f"Password '{password}' should be invalid"
    
    def test_email_validation(self, client):
        """Test email validation."""
        test_cases = [
            ("valid@example.com", True),
            ("test.email@domain.co.uk", True),
            ("invalid-email", False),
            ("@example.com", False),
            ("test@", False),
            ("", False),
        ]
        
        for email, should_be_valid in test_cases:
            user_data = {
                "email": email,
                "password": "SecurePass123!",
                "first_name": "Test",
                "last_name": "User",
                "role": "doctor"
            }
            
            response = client.post("/api/v1/auth/register", json=user_data)
            
            if should_be_valid:
                assert response.status_code == 201, f"Email '{email}' should be valid"
            else:
                assert response.status_code == 422, f"Email '{email}' should be invalid"
