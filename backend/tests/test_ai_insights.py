import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
import json

class TestAIInsights:
    """Test suite for AI insights endpoints."""
    
    def test_generate_insight_success(self, client, auth_headers, mock_auth_user, mock_llm_service):
        """Test successful AI insight generation."""
        insight_request = {
            "insight_type": "patient_analysis",
            "patient_id": "test_patient_123",
            "date_range": "30d"
        }
        
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            with patch('app.api.ai_insights.MockLLMService') as mock_llm:
                mock_llm.return_value.generate_insight.return_value = {
                    "title": "Test AI Insight",
                    "description": "This is a test AI insight",
                    "confidence_score": 0.85,
                    "recommendations": ["Test recommendation 1", "Test recommendation 2"],
                    "risk_level": "low"
                }
                
                response = client.post("/api/v1/insights/generate", 
                                    json=insight_request, 
                                    headers=auth_headers)
                
                assert response.status_code == 200
                data = response.json()
                assert data["message"] == "AI insight generated successfully"
                assert "insight_id" in data
                assert data["insight"]["title"] == "Test AI Insight"
                assert data["insight"]["confidence_score"] == 0.85
                assert len(data["insight"]["recommendations"]) == 2
    
    def test_generate_insight_unauthorized(self, client):
        """Test insight generation without authentication."""
        insight_request = {
            "insight_type": "patient_analysis",
            "patient_id": "test_patient_123"
        }
        
        response = client.post("/api/v1/insights/generate", json=insight_request)
        assert response.status_code == 401
    
    def test_generate_insight_invalid_type(self, client, auth_headers, mock_auth_user):
        """Test insight generation with invalid insight type."""
        insight_request = {
            "insight_type": "invalid_type",
            "patient_id": "test_patient_123"
        }
        
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            response = client.post("/api/v1/insights/generate", 
                                json=insight_request, 
                                headers=auth_headers)
            
            assert response.status_code == 400
            assert "Invalid insight type" in response.json()["detail"]
    
    def test_generate_insight_insufficient_permissions(self, client, parent_headers, mock_parent_user):
        """Test insight generation with insufficient permissions."""
        insight_request = {
            "insight_type": "patient_analysis",
            "patient_id": "test_patient_123"
        }
        
        with patch('app.api.auth.get_current_user', return_value=mock_parent_user):
            response = client.post("/api/v1/insights/generate", 
                                json=insight_request, 
                                headers=parent_headers)
            
            assert response.status_code == 403
            assert "Insufficient permissions" in response.json()["detail"]
    
    def test_get_insight_history_success(self, client, auth_headers, mock_auth_user, test_db):
        """Test successful insight history retrieval."""
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            response = client.get("/api/v1/insights/history", headers=auth_headers)
            
            assert response.status_code == 200
            data = response.json()
            assert "insights" in data
            assert isinstance(data["insights"], list)
    
    def test_get_insight_history_with_filter(self, client, auth_headers, mock_auth_user, test_db):
        """Test insight history retrieval with type filter."""
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            response = client.get("/api/v1/insights/history?insight_type=patient_analysis", 
                               headers=auth_headers)
            
            assert response.status_code == 200
            data = response.json()
            assert "insights" in data
    
    def test_get_insight_history_unauthorized(self, client):
        """Test insight history retrieval without authentication."""
        response = client.get("/api/v1/insights/history")
        assert response.status_code == 401
    
    def test_get_insight_analytics_success(self, client, auth_headers, mock_auth_user, test_db):
        """Test successful insight analytics retrieval."""
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            response = client.get("/api/v1/insights/analytics", headers=auth_headers)
            
            assert response.status_code == 200
            data = response.json()
            assert "total_insights" in data
            assert "insights_by_type" in data
            assert "insights_by_role" in data
            assert "recent_activity" in data
    
    def test_get_insight_analytics_unauthorized(self, client):
        """Test insight analytics retrieval without authentication."""
        response = client.get("/api/v1/insights/analytics")
        assert response.status_code == 401
    
    def test_patient_analysis_insight(self, client, auth_headers, mock_auth_user, mock_llm_service):
        """Test patient analysis insight generation."""
        insight_request = {
            "insight_type": "patient_analysis",
            "patient_id": "test_patient_123",
            "date_range": "90d"
        }
        
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            with patch('app.api.ai_insights.MockLLMService') as mock_llm:
                mock_llm.return_value.generate_insight.return_value = {
                    "title": "Patient Vision Analysis",
                    "description": "Patient shows consistent improvement in vision scores",
                    "confidence_score": 0.92,
                    "recommendations": [
                        "Continue current treatment plan",
                        "Schedule follow-up in 3 months"
                    ],
                    "risk_level": "low"
                }
                
                response = client.post("/api/v1/insights/generate", 
                                    json=insight_request, 
                                    headers=auth_headers)
                
                assert response.status_code == 200
                data = response.json()
                assert data["insight"]["insight_type"] == "patient_analysis"
                assert data["insight"]["confidence_score"] == 0.92
                assert data["insight"]["risk_level"] == "low"
    
    def test_screening_trends_insight(self, client, auth_headers, mock_auth_user, mock_llm_service):
        """Test screening trends insight generation."""
        insight_request = {
            "insight_type": "screening_trends",
            "date_range": "30d"
        }
        
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            with patch('app.api.ai_insights.MockLLMService') as mock_llm:
                mock_llm.return_value.generate_insight.return_value = {
                    "title": "Screening Trends Analysis",
                    "description": "Overall improvement in screening completion rates",
                    "confidence_score": 0.88,
                    "recommendations": [
                        "Continue current screening program",
                        "Focus on schools with lower completion rates"
                    ],
                    "risk_level": "none"
                }
                
                response = client.post("/api/v1/insights/generate", 
                                    json=insight_request, 
                                    headers=auth_headers)
                
                assert response.status_code == 200
                data = response.json()
                assert data["insight"]["insight_type"] == "screening_trends"
                assert data["insight"]["confidence_score"] == 0.88
                assert data["insight"]["risk_level"] == "none"
    
    def test_risk_assessment_insight(self, client, auth_headers, mock_auth_user, mock_llm_service):
        """Test risk assessment insight generation."""
        insight_request = {
            "insight_type": "risk_assessment",
            "patient_id": "test_patient_123"
        }
        
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            with patch('app.api.ai_insights.MockLLMService') as mock_llm:
                mock_llm.return_value.generate_insight.return_value = {
                    "title": "Risk Assessment",
                    "description": "Patient shows moderate risk factors for vision deterioration",
                    "confidence_score": 0.75,
                    "recommendations": [
                        "Increase monitoring frequency",
                        "Consider specialist consultation"
                    ],
                    "risk_level": "medium"
                }
                
                response = client.post("/api/v1/insights/generate", 
                                    json=insight_request, 
                                    headers=auth_headers)
                
                assert response.status_code == 200
                data = response.json()
                assert data["insight"]["insight_type"] == "risk_assessment"
                assert data["insight"]["confidence_score"] == 0.75
                assert data["insight"]["risk_level"] == "medium"
    
    def test_recommendations_insight(self, client, auth_headers, mock_auth_user, mock_llm_service):
        """Test recommendations insight generation."""
        insight_request = {
            "insight_type": "recommendations",
            "date_range": "60d"
        }
        
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            with patch('app.api.ai_insights.MockLLMService') as mock_llm:
                mock_llm.return_value.generate_insight.return_value = {
                    "title": "Treatment Recommendations",
                    "description": "Based on recent screening data, here are recommended actions",
                    "confidence_score": 0.90,
                    "recommendations": [
                        "Implement vision therapy program",
                        "Schedule regular follow-ups",
                        "Educate parents on vision care"
                    ],
                    "risk_level": "low"
                }
                
                response = client.post("/api/v1/insights/generate", 
                                    json=insight_request, 
                                    headers=auth_headers)
                
                assert response.status_code == 200
                data = response.json()
                assert data["insight"]["insight_type"] == "recommendations"
                assert data["insight"]["confidence_score"] == 0.90
                assert len(data["insight"]["recommendations"]) == 3
    
    def test_insight_generation_with_context(self, client, auth_headers, mock_auth_user, mock_llm_service):
        """Test insight generation with additional context."""
        insight_request = {
            "insight_type": "patient_analysis",
            "patient_id": "test_patient_123",
            "date_range": "30d",
            "context": {
                "include_trends": True,
                "compare_with_peers": True,
                "focus_areas": ["distance_vision", "near_vision"]
            }
        }
        
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            with patch('app.api.ai_insights.MockLLMService') as mock_llm:
                mock_llm.return_value.generate_insight.return_value = {
                    "title": "Comprehensive Patient Analysis",
                    "description": "Detailed analysis with peer comparison and trend analysis",
                    "confidence_score": 0.95,
                    "recommendations": ["Enhanced analysis complete"],
                    "risk_level": "low"
                }
                
                response = client.post("/api/v1/insights/generate", 
                                    json=insight_request, 
                                    headers=auth_headers)
                
                assert response.status_code == 200
                data = response.json()
                assert data["insight"]["confidence_score"] == 0.95
    
    def test_insight_generation_error_handling(self, client, auth_headers, mock_auth_user):
        """Test error handling during insight generation."""
        insight_request = {
            "insight_type": "patient_analysis",
            "patient_id": "test_patient_123"
        }
        
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            with patch('app.api.ai_insights.MockLLMService') as mock_llm:
                mock_llm.return_value.generate_insight.side_effect = Exception("LLM Service Error")
                
                response = client.post("/api/v1/insights/generate", 
                                    json=insight_request, 
                                    headers=auth_headers)
                
                assert response.status_code == 500
                assert "Failed to generate insight" in response.json()["detail"]
    
    def test_insight_confidence_scoring(self, client, auth_headers, mock_auth_user, mock_llm_service):
        """Test insight confidence scoring validation."""
        test_cases = [
            (0.5, True),   # Valid confidence score
            (0.95, True),  # High confidence score
            (0.0, False),  # Invalid: too low
            (1.1, False),  # Invalid: too high
            (-0.1, False), # Invalid: negative
        ]
        
        for confidence_score, should_be_valid in test_cases:
            insight_request = {
                "insight_type": "patient_analysis",
                "patient_id": "test_patient_123"
            }
            
            with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
                with patch('app.api.ai_insights.MockLLMService') as mock_llm:
                    mock_llm.return_value.generate_insight.return_value = {
                        "title": "Test Insight",
                        "description": "Test description",
                        "confidence_score": confidence_score,
                        "recommendations": ["Test recommendation"],
                        "risk_level": "low"
                    }
                    
                    response = client.post("/api/v1/insights/generate", 
                                        json=insight_request, 
                                        headers=auth_headers)
                    
                    if should_be_valid:
                        assert response.status_code == 200, f"Confidence score {confidence_score} should be valid"
                    else:
                        assert response.status_code == 500, f"Confidence score {confidence_score} should be invalid"
    
    def test_insight_risk_level_validation(self, client, auth_headers, mock_auth_user, mock_llm_service):
        """Test insight risk level validation."""
        valid_risk_levels = ["low", "medium", "high", "none"]
        
        for risk_level in valid_risk_levels:
            insight_request = {
                "insight_type": "patient_analysis",
                "patient_id": "test_patient_123"
            }
            
            with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
                with patch('app.api.ai_insights.MockLLMService') as mock_llm:
                    mock_llm.return_value.generate_insight.return_value = {
                        "title": "Test Insight",
                        "description": "Test description",
                        "confidence_score": 0.85,
                        "recommendations": ["Test recommendation"],
                        "risk_level": risk_level
                    }
                    
                    response = client.post("/api/v1/insights/generate", 
                                        json=insight_request, 
                                        headers=auth_headers)
                    
                    assert response.status_code == 200, f"Risk level {risk_level} should be valid"
    
    def test_insight_data_persistence(self, client, auth_headers, mock_auth_user, test_db, mock_llm_service):
        """Test that generated insights are properly stored in database."""
        insight_request = {
            "insight_type": "patient_analysis",
            "patient_id": "test_patient_123"
        }
        
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            with patch('app.api.ai_insights.MockLLMService') as mock_llm:
                mock_llm.return_value.generate_insight.return_value = {
                    "title": "Persistent Test Insight",
                    "description": "This insight should be stored",
                    "confidence_score": 0.85,
                    "recommendations": ["Test recommendation"],
                    "risk_level": "low"
                }
                
                # Generate insight
                response = client.post("/api/v1/insights/generate", 
                                    json=insight_request, 
                                    headers=auth_headers)
                
                assert response.status_code == 200
                insight_id = response.json()["insight_id"]
                
                # Verify insight is in history
                history_response = client.get("/api/v1/insights/history", headers=auth_headers)
                assert history_response.status_code == 200
                
                insights = history_response.json()["insights"]
                assert any(insight["insight_id"] == insight_id for insight in insights)
    
    def test_insight_analytics_aggregation(self, client, auth_headers, mock_auth_user, test_db):
        """Test insight analytics aggregation functionality."""
        with patch('app.api.auth.get_current_user', return_value=mock_auth_user):
            response = client.get("/api/v1/insights/analytics", headers=auth_headers)
            
            assert response.status_code == 200
            data = response.json()
            
            # Verify analytics structure
            assert "total_insights" in data
            assert "insights_by_type" in data
            assert "insights_by_role" in data
            assert "recent_activity" in data
            assert "confidence_distribution" in data
            assert "risk_level_distribution" in data
            
            # Verify data types
            assert isinstance(data["total_insights"], int)
            assert isinstance(data["insights_by_type"], dict)
            assert isinstance(data["insights_by_role"], dict)
            assert isinstance(data["recent_activity"], list)
