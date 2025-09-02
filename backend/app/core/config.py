import os
from typing import Dict, Any, List
from pydantic import Field
from pydantic_settings import BaseSettings

# Hardcoded module registry
MODULE_REGISTRY = {
    "core": {
        "auth": {
            "enabled": True,
            "version": "1.0.0",
            "dependencies": [],
            "config": {
                "jwt_secret": os.getenv("JWT_SECRET_KEY", "hardcoded_secret_key"),
                "jwt_expires_in": "24h",
                "bcrypt_rounds": 12,
                "session_timeout": 3600,
                "roles": {
                    "admin": ["admin", "super_admin"],
                    "medical": ["doctor", "nurse", "medical_staff", "exclusive_hospital"],
                    "general": ["teacher", "parent", "general_user"]
                }
            }
        },
        "database": {
            "enabled": True,
            "version": "1.0.0",
            "dependencies": [],
            "config": {
                "collections": {
                    "users": "users",
                    "admin_users": "admin_users",
                    "medical_staff_users": "medical_staff_users",
                    "patients": "patients",
                    "screenings": "screenings",
                    "school_screenings": "school_screenings",
                    "system_settings": "system_settings",
                    "audit_logs": "audit_logs"
                },
                "backup": {
                    "schedule": "daily",
                    "retention": 30,
                    "compression": True
                }
            }
        }
    },
    "features": {
        "patient_management": {
            "enabled": True,
            "version": "1.0.0",
            "dependencies": ["auth", "database"],
            "config": {
                "features": {
                    "search": True,
                    "import": True,
                    "export": True,
                    "analytics": True
                },
                "extensions": {
                    "demographics": {"enabled": True},
                    "insurance": {"enabled": False},
                    "appointments": {"enabled": False}
                }
            }
        },
        "screening": {
            "enabled": True,
            "version": "1.0.0",
            "dependencies": ["auth", "database", "patient_management"],
            "config": {
                "extensions": {
                    "vision_tests": {"enabled": True},
                    "eye_pressure": {"enabled": False},
                    "color_blindness": {"enabled": False}
                }
            }
        },
        "reporting": {
            "enabled": True,
            "version": "1.0.0",
            "dependencies": ["auth", "database"],
            "config": {
                "extensions": {
                    "charts": {"enabled": True},
                    "dashboards": {"enabled": True},
                    "exports": {"enabled": True}
                }
            }
        },
        "notifications": {
            "enabled": True,
            "version": "1.0.0",
            "dependencies": ["auth", "database"],
            "config": {
                "channels": {
                    "email": {"enabled": True},
                    "sms": {"enabled": False},
                    "push": {"enabled": False},
                    "in_app": {"enabled": True}
                },
                "extensions": {
                    "scheduling": {"enabled": False},
                    "preferences": {"enabled": True},
                    "analytics": {"enabled": False}
                }
            }
        },
        "ai_ml": {
            "enabled": True,
            "version": "1.0.0",
            "dependencies": ["auth", "database", "patient_management", "screening"],
            "config": {
                "llm_provider": "openai",  # openai, anthropic
                "model_name": "gpt-4",
                "vector_dimensions": 1536,
                "max_tokens": 2000,
                "temperature": 0.7,
                "insight_generation": True,
                "predictive_analytics": True,
                "role_based_insights": True
            }
        },
        "line_integration": {
            "enabled": False,
            "version": "1.0.0",
            "dependencies": ["auth", "database", "notifications", "patient_management"],
            "config": {
                "line_channel_access_token": os.getenv("LINE_CHANNEL_ACCESS_TOKEN", ""),
                "line_channel_secret": os.getenv("LINE_CHANNEL_SECRET", ""),
                "webhook_url": "/api/v1/line_integration/webhook",
                "features": {
                    "screening_reminders": True,
                    "result_notifications": True,
                    "appointment_management": True,
                    "educational_content": True,
                    "support_chat": True
                }
            }
        }
    },
    "planned": {
        "telemedicine": {
            "enabled": False,
            "version": "0.1.0",
            "dependencies": ["auth", "database", "patient_management"],
            "config": {
                "extensions": {
                    "video_calls": {"enabled": False},
                    "remote_diagnostics": {"enabled": False},
                    "prescriptions": {"enabled": False}
                }
            }
        },
        "mobile_app": {
            "enabled": False,
            "version": "0.1.0",
            "dependencies": ["auth", "database", "notifications"],
            "config": {
                "extensions": {
                    "offline_sync": {"enabled": False},
                    "push_notifications": {"enabled": False},
                    "biometrics": {"enabled": False}
                }
            }
        }
    }
}

# Feature flags
FEATURE_FLAGS = {
    # Core features
    "patient_management": True,
    "screening": True,
    "reporting": True,
    "notifications": True,
    "ai_ml": True,
    "line_integration": False,
    
    # Experimental features
    "ai_analytics": False,
    "telemedicine": False,
    "mobile_app": False,
    
    # Module-specific features
    "demographics": True,
    "insurance": False,
    "appointments": False,
    "vision_tests": True,
    "eye_pressure": False,
    "color_blindness": False,
    "charts": True,
    "dashboards": True,
    "exports": True,
    "email": True,
    "sms": False,
    "push": False,
    "in_app": True,
    "scheduling": False,
    "preferences": True,
    "analytics": False
}

class Settings(BaseSettings):
    """Application settings"""
    
    # CDN Configuration
    CDN_ENABLED: bool = Field(default=True, env="CDN_ENABLED")
    FILE_STORAGE_PATH: str = Field(default="/app/storage", env="FILE_STORAGE_PATH")
    SECURE_FILE_ACCESS: bool = Field(default=True, env="SECURE_FILE_ACCESS")
    
    # JWT Configuration
    JWT_SECRET_KEY: str = Field(default="hardcoded_secret_key", env="JWT_SECRET_KEY")
    JWT_ALGORITHM: str = Field(default="HS256", env="JWT_ALGORITHM")
    JWT_EXPIRATION_HOURS: int = Field(default=24, env="JWT_EXPIRATION_HOURS")
    
    # Database Configuration
    DATABASE_URL: str = Field(default="mongodb://localhost:27017/evep", env="DATABASE_URL")
    
    # API Configuration
    API_URL: str = Field(default="http://localhost:8013", env="API_URL")
    
    # Environment
    NODE_ENV: str = Field(default="development", env="NODE_ENV")
    
    # AI Service Configuration
    ai_service_enabled: bool = Field(default=False, env="AI_SERVICE_ENABLED")
    ai_service_url: str = Field(default="http://ai-service:8001", env="AI_SERVICE_URL")
    ai_service_timeout: int = Field(default=30, env="AI_SERVICE_TIMEOUT")

# Create settings instance
settings = Settings()

class Config:
    @staticmethod
    def get_module_config(module_name: str) -> Dict[str, Any]:
        """Get configuration for a specific module"""
        for category in MODULE_REGISTRY.values():
            if module_name in category:
                return category[module_name]
        return {}
    
    @staticmethod
    def is_feature_enabled(feature: str) -> bool:
        """Check if a feature is enabled"""
        return FEATURE_FLAGS.get(feature, False)
    
    @staticmethod
    def get_all_modules() -> List[str]:
        """Get all available modules"""
        modules = []
        for category in MODULE_REGISTRY.values():
            modules.extend(category.keys())
        return modules
    
    @staticmethod
    def get_enabled_modules() -> List[str]:
        """Get all enabled modules"""
        enabled_modules = []
        for category in MODULE_REGISTRY.values():
            for module_name, module_config in category.items():
                if module_config.get("enabled", False):
                    enabled_modules.append(module_name)
        return enabled_modules
    
    @staticmethod
    def get_module_dependencies(module_name: str) -> List[str]:
        """Get dependencies for a module"""
        config = Config.get_module_config(module_name)
        return config.get("dependencies", [])
    
    @staticmethod
    def is_module_enabled(module_name: str) -> bool:
        """Check if a module is enabled"""
        config = Config.get_module_config(module_name)
        return config.get("enabled", False)
    
    @staticmethod
    def get_environment() -> str:
        """Get current environment"""
        return os.getenv("NODE_ENV", "development")
    
    @staticmethod
    def get_database_url() -> str:
        """Get database connection URL"""
        return os.getenv("DATABASE_URL", "mongodb://localhost:27017/evep")
    
    @staticmethod
    def get_api_url() -> str:
        """Get API base URL"""
        return os.getenv("API_URL", "http://localhost:8013")
