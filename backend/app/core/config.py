from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    # Application Settings
    APP_NAME: str = "EVEP API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    
    # Security
    SECRET_KEY: str = "your-super-secret-key-here-change-this-in-production"
    JWT_SECRET_KEY: str = "your-jwt-secret-key"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # Database
    DATABASE_URL: str = "mongodb://mongo-primary:27017,mongo-secondary-1:27017,mongo-secondary-2:27017/evep?replicaSet=rs0"
    MONGO_ROOT_USERNAME: str = "admin"
    MONGO_ROOT_PASSWORD: str = "password"
    MONGO_DATABASE: str = "evep"
    MONGO_REPLICA_SET_NAME: str = "rs0"
    
    # Redis Cluster
    REDIS_URL: str = "redis://redis-master-1:6379,redis-master-2:6379,redis-master-3:6379"
    REDIS_PASSWORD: Optional[str] = None
    REDIS_CLUSTER_ENABLED: bool = True
    
    # AI/ML Services
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    
    # Communication Services
    TELEGRAM_BOT_TOKEN: Optional[str] = None
    TELEGRAM_CHAT_ID: Optional[str] = None
    
    # LINE Integration
    LINE_CHANNEL_ACCESS_TOKEN: Optional[str] = None
    LINE_CHANNEL_SECRET: Optional[str] = None
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001"
    ]
    
    # File Storage
    STORAGE_TYPE: str = "local"
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    FILE_STORAGE_PATH: str = "/app/storage"
    SECURE_FILE_ACCESS: bool = True
    CDN_ENABLED: bool = True
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/evep.log"
    
    # Performance
    WORKERS: int = 4
    MAX_CONNECTIONS: int = 100
    TIMEOUT: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Create settings instance
settings = Settings()

# Create upload directory if it doesn't exist
try:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs("logs", exist_ok=True)
except PermissionError:
    # If we can't create directories, continue without them
    pass
