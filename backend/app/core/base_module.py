from abc import ABC, abstractmethod
from typing import Dict, Any, List
from fastapi import APIRouter
from .module_registry import module_registry

class BaseModule(ABC):
    def __init__(self, module_name: str = None, config: Dict[str, Any] = None):
        self.module_name = module_name or "unknown"
        self.config = config or {}
        self.dependencies = self.config.get("dependencies", [])
        self.extensions = []
        self.router = APIRouter()
        
        # Register module if name is provided
        if module_name:
            module_registry.register_module(module_name, self)
    
    @abstractmethod
    async def initialize(self) -> None:
        """Initialize the module"""
        pass
    
    @abstractmethod
    def get_router(self) -> APIRouter:
        """Get the module's API router"""
        pass
    
    @abstractmethod
    def get_events(self) -> List[str]:
        """Get list of events this module emits"""
        pass
    
    def get_extensions(self) -> List[Any]:
        """Get module extensions"""
        return self.extensions
    
    def add_extension(self, extension: Any) -> None:
        """Add an extension to the module"""
        self.extensions.append(extension)
    
    def get_config(self, key: str, default: Any = None) -> Any:
        """Get configuration value"""
        return self.config.get(key, default)
    
    def is_feature_enabled(self, feature: str) -> bool:
        """Check if a feature is enabled in this module"""
        extensions = self.config.get("extensions", {})
        return extensions.get(feature, {}).get("enabled", False)
    
    def get_module_info(self) -> Dict[str, Any]:
        """Get module information"""
        return {
            "name": self.module_name,
            "version": self.config.get("version", "1.0.0"),
            "dependencies": self.dependencies,
            "extensions": [ext.name for ext in self.extensions],
            "events": self.get_events(),
            "enabled": True
        }
    
    def validate_dependencies(self) -> bool:
        """Validate that all dependencies are available"""
        for dependency in self.dependencies:
            if not module_registry.get_module(dependency):
                return False
        return True



