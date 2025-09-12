"""
Configuration settings for AI/ML Service
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """AI Service Configuration"""
    
    # Service Configuration
    service_name: str = "EVEP AI/ML Service"
    service_version: str = "1.0.0"
    debug: bool = False
    
    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8001
    
    # AI/ML Configuration
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    
    # Model Configuration
    default_embedding_model: str = "all-MiniLM-L6-v2"
    default_llm_model: str = "gpt-4"
    default_claude_model: str = "claude-3-sonnet-20240229"
    
    # Vector Database Configuration
    chroma_persist_dir: str = "/app/chroma_db"
    model_cache_dir: str = "/app/models"
    
    # Performance Configuration
    max_concurrent_requests: int = 5
    request_timeout: int = 60
    max_workers: int = 3
    
    # Redis Configuration (for background tasks)
    redis_url: str = "redis://redis-master-1:6379"
    
    # Monitoring Configuration
    metrics_port: int = 8002
    prometheus_multiproc_dir: str = "/tmp"
    
    # Logging Configuration
    log_level: str = "INFO"
    log_format: str = "json"
    
    # Security Configuration
    cors_origins: list = ["*"]
    api_key_header: str = "X-API-Key"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# Global settings instance
settings = Settings()

# Validate required settings
def validate_settings():
    """Validate required settings"""
    if not settings.openai_api_key and not settings.anthropic_api_key:
        raise ValueError("At least one AI API key (OpenAI or Anthropic) must be provided")

# Validate on import
try:
    validate_settings()
except ValueError as e:
    print(f"Configuration error: {e}")
    # Don't raise here, let the application handle it gracefully
