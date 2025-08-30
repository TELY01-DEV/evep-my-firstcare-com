"""
Unit tests for AI integration functionality
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime
from typing import Dict, Any

from app.services.ai_client import AIServiceClient
from app.core.config import settings


class TestAIServiceClient:
    """Test cases for AI Service Client"""
    
    @pytest.fixture
    def ai_client(self):
        """Create AI client instance for testing"""
        return AIServiceClient()
    
    @pytest.fixture
    def mock_screening_data(self):
        """Mock screening data for testing"""
        return {
            "patient_id": "test_patient_123",
            "screening_date": "2024-01-15",
            "left_eye_distance": "20/20",
            "right_eye_distance": "20/25",
            "left_eye_near": "20/20",
            "right_eye_near": "20/20",
            "color_vision": "normal",
            "depth_perception": "normal"
        }
    
    @pytest.fixture
    def mock_patient_info(self):
        """Mock patient information for testing"""
        return {
            "patient_id": "test_patient_123",
            "name": "John Doe",
            "age": 25,
            "gender": "male",
            "school": "Test School",
            "grade": "5th Grade"
        }
    
    @pytest.mark.asyncio
    async def test_ai_client_initialization(self, ai_client):
        """Test AI client initialization"""
        assert ai_client.base_url == settings.ai_service_url
        assert ai_client.timeout == settings.ai_service_timeout
        assert ai_client.enabled == settings.ai_service_enabled
    
    @pytest.mark.asyncio
    async def test_health_check_disabled(self, ai_client):
        """Test health check when AI service is disabled"""
        ai_client.enabled = False
        
        result = await ai_client.health_check()
        
        assert result["status"] == "disabled"
        assert "AI service is disabled" in result["reason"]
        assert "timestamp" in result
    
    @pytest.mark.asyncio
    async def test_health_check_enabled_success(self, ai_client):
        """Test health check when AI service is enabled and healthy"""
        ai_client.enabled = True
        
        mock_response = Mock()
        mock_response.status = 200
        mock_response.json = AsyncMock(return_value={
            "status": "healthy",
            "components": {"llm_service": True, "vector_store": True}
        })
        
        with patch.object(ai_client, '_get_session') as mock_get_session:
            mock_session = Mock()
            mock_session.get = AsyncMock(return_value=mock_response)
            mock_get_session.return_value = mock_session
            
            result = await ai_client.health_check()
            
            assert result["status"] == "healthy"
            assert result["components"]["llm_service"] is True
            assert result["components"]["vector_store"] is True
    
    @pytest.mark.asyncio
    async def test_health_check_enabled_failure(self, ai_client):
        """Test health check when AI service is enabled but unhealthy"""
        ai_client.enabled = True
        
        mock_response = Mock()
        mock_response.status = 500
        
        with patch.object(ai_client, '_get_session') as mock_get_session:
            mock_session = Mock()
            mock_session.get = AsyncMock(return_value=mock_response)
            mock_get_session.return_value = mock_session
            
            result = await ai_client.health_check()
            
            assert result["status"] == "unhealthy"
            assert "HTTP 500" in result["reason"]
    
    @pytest.mark.asyncio
    async def test_generate_insight_disabled(self, ai_client, mock_screening_data):
        """Test insight generation when AI service is disabled"""
        ai_client.enabled = False
        
        with pytest.raises(RuntimeError, match="AI service is disabled"):
            await ai_client.generate_insight(
                screening_data=mock_screening_data,
                role="doctor",
                insight_type="screening_analysis"
            )
    
    @pytest.mark.asyncio
    async def test_generate_insight_success(self, ai_client, mock_screening_data, mock_patient_info):
        """Test successful insight generation"""
        ai_client.enabled = True
        
        mock_insight = {
            "insight_id": "test_insight_123",
            "content": "Patient shows normal vision with slight right eye distance vision reduction.",
            "role": "doctor",
            "insight_type": "screening_analysis",
            "model_used": "gpt-4",
            "template_used": "doctor_screening_analysis",
            "success": True
        }
        
        mock_response = Mock()
        mock_response.status = 200
        mock_response.json = AsyncMock(return_value={
            "success": True,
            "insight": mock_insight
        })
        
        with patch.object(ai_client, '_get_session') as mock_get_session:
            mock_session = Mock()
            mock_session.post = AsyncMock(return_value=mock_response)
            mock_get_session.return_value = mock_session
            
            result = await ai_client.generate_insight(
                screening_data=mock_screening_data,
                patient_info=mock_patient_info,
                role="doctor",
                insight_type="screening_analysis"
            )
            
            assert result == mock_insight
            assert result["insight_id"] == "test_insight_123"
            assert result["success"] is True
    
    @pytest.mark.asyncio
    async def test_generate_insight_failure(self, ai_client, mock_screening_data):
        """Test insight generation failure"""
        ai_client.enabled = True
        
        mock_response = Mock()
        mock_response.status = 500
        mock_response.text = AsyncMock(return_value="Internal server error")
        
        with patch.object(ai_client, '_get_session') as mock_get_session:
            mock_session = Mock()
            mock_session.post = AsyncMock(return_value=mock_response)
            mock_get_session.return_value = mock_session
            
            with pytest.raises(RuntimeError, match="AI service error: 500"):
                await ai_client.generate_insight(
                    screening_data=mock_screening_data,
                    role="doctor",
                    insight_type="screening_analysis"
                )
    
    @pytest.mark.asyncio
    async def test_search_insights_disabled(self, ai_client):
        """Test insight search when AI service is disabled"""
        ai_client.enabled = False
        
        with pytest.raises(RuntimeError, match="AI service is disabled"):
            await ai_client.search_insights(
                query="vision screening",
                n_results=10
            )
    
    @pytest.mark.asyncio
    async def test_search_insights_success(self, ai_client):
        """Test successful insight search"""
        ai_client.enabled = True
        
        mock_results = [
            {
                "insight_id": "insight_1",
                "content": "Vision screening analysis for patient",
                "role": "doctor",
                "insight_type": "screening_analysis",
                "metadata": {"created_at": "2024-01-15T10:30:00Z"}
            },
            {
                "insight_id": "insight_2",
                "content": "Another vision screening insight",
                "role": "teacher",
                "insight_type": "academic_impact",
                "metadata": {"created_at": "2024-01-15T11:00:00Z"}
            }
        ]
        
        mock_response = Mock()
        mock_response.status = 200
        mock_response.json = AsyncMock(return_value={
            "success": True,
            "results": mock_results
        })
        
        with patch.object(ai_client, '_get_session') as mock_get_session:
            mock_session = Mock()
            mock_session.post = AsyncMock(return_value=mock_response)
            mock_get_session.return_value = mock_session
            
            result = await ai_client.search_insights(
                query="vision screening",
                role="doctor",
                insight_type="screening_analysis",
                n_results=10
            )
            
            assert result == mock_results
            assert len(result) == 2
            assert result[0]["insight_id"] == "insight_1"
            assert result[1]["insight_id"] == "insight_2"
    
    @pytest.mark.asyncio
    async def test_get_statistics_disabled(self, ai_client):
        """Test getting statistics when AI service is disabled"""
        ai_client.enabled = False
        
        result = await ai_client.get_statistics()
        
        assert result["status"] == "disabled"
        assert "AI service is disabled" in result["reason"]
    
    @pytest.mark.asyncio
    async def test_get_statistics_success(self, ai_client):
        """Test successful statistics retrieval"""
        ai_client.enabled = True
        
        mock_stats = {
            "service_status": "running",
            "initialized": True,
            "components": {
                "llm_service": True,
                "vector_store": True,
                "prompt_manager": True,
                "insight_generator": True
            },
            "vector_store_stats": {
                "document_count": 150,
                "collection_count": 5
            },
            "prompt_template_stats": {
                "active_templates": 12,
                "role_distribution": {
                    "doctor": 4,
                    "teacher": 3,
                    "parent": 3,
                    "executive": 2
                }
            }
        }
        
        mock_response = Mock()
        mock_response.status = 200
        mock_response.json = AsyncMock(return_value=mock_stats)
        
        with patch.object(ai_client, '_get_session') as mock_get_session:
            mock_session = Mock()
            mock_session.get = AsyncMock(return_value=mock_response)
            mock_get_session.return_value = mock_session
            
            result = await ai_client.get_statistics()
            
            assert result == mock_stats
            assert result["service_status"] == "running"
            assert result["initialized"] is True
            assert result["components"]["llm_service"] is True
    
    @pytest.mark.asyncio
    async def test_get_templates_disabled(self, ai_client):
        """Test getting templates when AI service is disabled"""
        ai_client.enabled = False
        
        result = await ai_client.get_templates()
        
        assert result == []
    
    @pytest.mark.asyncio
    async def test_get_templates_success(self, ai_client):
        """Test successful templates retrieval"""
        ai_client.enabled = True
        
        mock_templates = [
            {
                "template_id": "doctor_screening_analysis",
                "role": "doctor",
                "insight_type": "screening_analysis",
                "prompt_template": "Analyze the screening data for {role}...",
                "variables": ["role", "screening_data"],
                "version": "1.0",
                "is_active": True
            },
            {
                "template_id": "teacher_academic_impact",
                "role": "teacher",
                "insight_type": "academic_impact",
                "prompt_template": "Assess academic impact for {role}...",
                "variables": ["role", "student_data"],
                "version": "1.0",
                "is_active": True
            }
        ]
        
        mock_response = Mock()
        mock_response.status = 200
        mock_response.json = AsyncMock(return_value={
            "success": True,
            "templates": mock_templates
        })
        
        with patch.object(ai_client, '_get_session') as mock_get_session:
            mock_session = Mock()
            mock_session.get = AsyncMock(return_value=mock_response)
            mock_get_session.return_value = mock_session
            
            result = await ai_client.get_templates()
            
            assert result == mock_templates
            assert len(result) == 2
            assert result[0]["template_id"] == "doctor_screening_analysis"
            assert result[1]["template_id"] == "teacher_academic_impact"
    
    @pytest.mark.asyncio
    async def test_session_management(self, ai_client):
        """Test HTTP session management"""
        # Test session creation
        session1 = await ai_client._get_session()
        assert session1 is not None
        
        # Test session reuse
        session2 = await ai_client._get_session()
        assert session2 is session1
        
        # Test session cleanup
        await ai_client.close()
        assert ai_client._session is None or ai_client._session.closed
    
    @pytest.mark.asyncio
    async def test_error_handling_network_error(self, ai_client, mock_screening_data):
        """Test error handling for network errors"""
        ai_client.enabled = True
        
        with patch.object(ai_client, '_get_session') as mock_get_session:
            mock_get_session.side_effect = Exception("Network error")
            
            with pytest.raises(Exception, match="Network error"):
                await ai_client.generate_insight(
                    screening_data=mock_screening_data,
                    role="doctor",
                    insight_type="screening_analysis"
                )
    
    @pytest.mark.asyncio
    async def test_error_handling_json_error(self, ai_client, mock_screening_data):
        """Test error handling for JSON parsing errors"""
        ai_client.enabled = True
        
        mock_response = Mock()
        mock_response.status = 200
        mock_response.json = AsyncMock(side_effect=Exception("JSON decode error"))
        
        with patch.object(ai_client, '_get_session') as mock_get_session:
            mock_session = Mock()
            mock_session.post = AsyncMock(return_value=mock_response)
            mock_get_session.return_value = mock_session
            
            with pytest.raises(Exception, match="JSON decode error"):
                await ai_client.generate_insight(
                    screening_data=mock_screening_data,
                    role="doctor",
                    insight_type="screening_analysis"
                )


class TestAIIntegrationEndpoints:
    """Test cases for AI integration API endpoints"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        from fastapi.testclient import TestClient
        from app.main import app
        return TestClient(app)
    
    @pytest.fixture
    def mock_ai_client(self):
        """Mock AI client for testing"""
        with patch('app.api.ai_insights.ai_client') as mock_client:
            yield mock_client
    
    def test_ai_insights_health_check(self, client, mock_ai_client):
        """Test AI insights health check endpoint"""
        mock_ai_client.health_check.return_value = {
            "status": "healthy",
            "components": {"llm_service": True, "vector_store": True},
            "timestamp": "2024-01-15T10:30:00Z"
        }
        
        response = client.get("/api/v1/ai-insights/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["components"]["llm_service"] is True
    
    def test_generate_screening_insight_success(self, client, mock_ai_client):
        """Test successful screening insight generation"""
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
        
        request_data = {
            "screening_data": {
                "patient_id": "test_patient_123",
                "left_eye_distance": "20/20",
                "right_eye_distance": "20/25"
            },
            "patient_info": {
                "name": "John Doe",
                "age": 25
            },
            "role": "doctor",
            "insight_type": "screening_analysis"
        }
        
        response = client.post(
            "/api/v1/ai-insights/generate-screening-insight",
            json=request_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["insight"]["insight_id"] == "test_insight_123"
    
    def test_generate_screening_insight_disabled(self, client, mock_ai_client):
        """Test insight generation when AI service is disabled"""
        mock_ai_client.generate_insight.side_effect = RuntimeError("AI service is disabled")
        
        request_data = {
            "screening_data": {"patient_id": "test_patient_123"},
            "role": "doctor",
            "insight_type": "screening_analysis"
        }
        
        response = client.post(
            "/api/v1/ai-insights/generate-screening-insight",
            json=request_data
        )
        
        assert response.status_code == 500
        data = response.json()
        assert "AI service is disabled" in data["detail"]
    
    def test_search_insights_success(self, client, mock_ai_client):
        """Test successful insight search"""
        mock_results = [
            {
                "insight_id": "insight_1",
                "content": "Vision screening analysis",
                "role": "doctor",
                "insight_type": "screening_analysis"
            }
        ]
        
        mock_ai_client.search_insights.return_value = mock_results
        
        request_data = {
            "query": "vision screening",
            "role": "doctor",
            "n_results": 10
        }
        
        response = client.post(
            "/api/v1/ai-insights/search-insights",
            json=request_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["results"]) == 1
        assert data["results"][0]["insight_id"] == "insight_1"
    
    def test_get_ai_statistics(self, client, mock_ai_client):
        """Test getting AI service statistics"""
        mock_stats = {
            "service_status": "running",
            "initialized": True,
            "components": {
                "llm_service": True,
                "vector_store": True
            }
        }
        
        mock_ai_client.get_statistics.return_value = mock_stats
        
        response = client.get("/api/v1/ai-insights/statistics")
        
        assert response.status_code == 200
        data = response.json()
        assert data["service_status"] == "running"
        assert data["initialized"] is True


if __name__ == "__main__":
    pytest.main([__file__])

