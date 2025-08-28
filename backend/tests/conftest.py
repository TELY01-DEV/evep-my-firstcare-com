import pytest
import asyncio
from fastapi.testclient import TestClient
from motor.motor_asyncio import AsyncIOMotorClient
from unittest.mock import AsyncMock, patch
import os
import sys

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.main import app
from app.core.config import settings
from app.core.database import get_database

# Test database configuration
TEST_MONGODB_URL = "mongodb://localhost:27017/evep_test"
TEST_REDIS_URL = "redis://localhost:6379/1"

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def test_db():
    """Create a test database connection."""
    client = AsyncIOMotorClient(TEST_MONGODB_URL)
    db = client.get_database()
    
    # Clean up test database before each test
    collections = await db.list_collection_names()
    for collection in collections:
        await db[collection].delete_many({})
    
    yield db
    
    # Clean up after test
    collections = await db.list_collection_names()
    for collection in collections:
        await db[collection].delete_many({})
    client.close()

@pytest.fixture
def client(test_db):
    """Create a test client with mocked database."""
    with patch('app.core.database.get_database', return_value=test_db):
        with TestClient(app) as test_client:
            yield test_client

@pytest.fixture
def mock_auth_user():
    """Mock authenticated user for testing."""
    return {
        "user_id": "test_user_123",
        "email": "test@example.com",
        "role": "doctor",
        "organization": "Test Hospital",
        "first_name": "Test",
        "last_name": "Doctor"
    }

@pytest.fixture
def mock_admin_user():
    """Mock admin user for testing."""
    return {
        "user_id": "admin_user_123",
        "email": "admin@example.com",
        "role": "admin",
        "organization": "EVEP Admin",
        "first_name": "Admin",
        "last_name": "User"
    }

@pytest.fixture
def mock_teacher_user():
    """Mock teacher user for testing."""
    return {
        "user_id": "teacher_user_123",
        "email": "teacher@school.com",
        "role": "teacher",
        "organization": "Test School",
        "first_name": "Test",
        "last_name": "Teacher"
    }

@pytest.fixture
def mock_parent_user():
    """Mock parent user for testing."""
    return {
        "user_id": "parent_user_123",
        "email": "parent@example.com",
        "role": "parent",
        "organization": "Home",
        "first_name": "Test",
        "last_name": "Parent"
    }

@pytest.fixture
def sample_patient_data():
    """Sample patient data for testing."""
    return {
        "first_name": "John",
        "last_name": "Doe",
        "date_of_birth": "2015-03-15",
        "gender": "male",
        "school": "Test School",
        "grade": "3A",
        "parent_name": "Jane Doe",
        "parent_phone": "+66-123-456-789",
        "parent_email": "jane.doe@example.com",
        "address": "123 Test Street, Bangkok",
        "medical_history": "None",
        "allergies": "None",
        "emergency_contact": "+66-987-654-321"
    }

@pytest.fixture
def sample_screening_data():
    """Sample screening data for testing."""
    return {
        "patient_id": "test_patient_123",
        "screening_type": "comprehensive",
        "equipment_used": "standard_chart",
        "examiner_notes": "Patient cooperative during screening",
        "status": "completed",
        "results": {
            "left_eye_distance": "20/20",
            "right_eye_distance": "20/25",
            "left_eye_near": "20/20",
            "right_eye_near": "20/20",
            "color_vision": "normal",
            "depth_perception": "normal"
        }
    }

@pytest.fixture
def mock_redis():
    """Mock Redis client for testing."""
    with patch('app.core.redis.get_redis_client') as mock_redis:
        mock_redis.return_value = AsyncMock()
        yield mock_redis.return_value

@pytest.fixture
def mock_socketio():
    """Mock Socket.IO service for testing."""
    with patch('app.socketio_service.socketio_service') as mock_socketio:
        mock_socketio.emit = AsyncMock()
        yield mock_socketio

@pytest.fixture
def mock_llm_service():
    """Mock LLM service for AI insights testing."""
    with patch('app.api.ai_insights.MockLLMService') as mock_llm:
        mock_llm.return_value.generate_insight.return_value = {
            "title": "Test AI Insight",
            "description": "This is a test AI insight",
            "confidence_score": 0.85,
            "recommendations": ["Test recommendation 1", "Test recommendation 2"],
            "risk_level": "low"
        }
        yield mock_llm.return_value

@pytest.fixture
def auth_headers(mock_auth_user):
    """Generate authentication headers for testing."""
    with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
        return {"Authorization": "Bearer test_token"}

@pytest.fixture
def admin_headers(mock_admin_user):
    """Generate admin authentication headers for testing."""
    with patch('app.api.auth.get_current_user', return_value=mock_admin_user):
        return {"Authorization": "Bearer admin_token"}

@pytest.fixture
def teacher_headers(mock_teacher_user):
    """Generate teacher authentication headers for testing."""
    with patch('app.api.auth.get_current_user', return_value=mock_teacher_user):
        return {"Authorization": "Bearer teacher_token"}

@pytest.fixture
def parent_headers(mock_parent_user):
    """Generate parent authentication headers for testing."""
    with patch('app.api.auth.get_current_user', return_value=mock_parent_user):
        return {"Authorization": "Bearer parent_token"}

# Test utilities
class TestUtils:
    @staticmethod
    async def create_test_user(db, user_data):
        """Create a test user in the database."""
        result = await db["users"].insert_one(user_data)
        return str(result.inserted_id)
    
    @staticmethod
    async def create_test_patient(db, patient_data):
        """Create a test patient in the database."""
        result = await db["patients"].insert_one(patient_data)
        return str(result.inserted_id)
    
    @staticmethod
    async def create_test_screening(db, screening_data):
        """Create a test screening in the database."""
        result = await db["screenings"].insert_one(screening_data)
        return str(result.inserted_id)
    
    @staticmethod
    async def cleanup_test_data(db):
        """Clean up all test data from the database."""
        collections = ["users", "patients", "screenings", "ai_insights", "analytics_data"]
        for collection in collections:
            await db[collection].delete_many({})

# Performance testing utilities
class PerformanceTestUtils:
    @staticmethod
    async def generate_bulk_data(db, collection_name, data_template, count=100):
        """Generate bulk test data for performance testing."""
        bulk_data = []
        for i in range(count):
            data = data_template.copy()
            data["_id"] = f"test_{collection_name}_{i}"
            bulk_data.append(data)
        
        if bulk_data:
            await db[collection_name].insert_many(bulk_data)
        
        return len(bulk_data)
    
    @staticmethod
    async def measure_response_time(client, method, url, **kwargs):
        """Measure API response time."""
        import time
        start_time = time.time()
        response = getattr(client, method.lower())(url, **kwargs)
        end_time = time.time()
        return response, end_time - start_time
