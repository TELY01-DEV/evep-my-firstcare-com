from typing import Dict, Any, List, Optional
from .config import MODULE_REGISTRY

class ModuleRegistry:
    _instance = None
    _modules: Dict[str, Any] = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def register_module(self, module_name: str, module_instance: Any) -> None:
        """Register a module instance"""
        self._modules[module_name] = module_instance
    
    def get_module(self, module_name: str) -> Optional[Any]:
        """Get a registered module"""
        return self._modules.get(module_name)
    
    def get_all_modules(self) -> Dict[str, Any]:
        """Get all registered modules"""
        return self._modules.copy()
    
    def get_module_config(self, module_name: str) -> Dict[str, Any]:
        """Get configuration for a module"""
        for category in MODULE_REGISTRY.values():
            if module_name in category:
                return category[module_name]
        return {}
    
    def get_module_dependencies(self, module_name: str) -> List[str]:
        """Get dependencies for a module"""
        config = self.get_module_config(module_name)
        return config.get("dependencies", [])
    
    def is_module_enabled(self, module_name: str) -> bool:
        """Check if a module is enabled"""
        config = self.get_module_config(module_name)
        return config.get("enabled", False)
    
    def get_module_version(self, module_name: str) -> str:
        """Get version for a module"""
        config = self.get_module_config(module_name)
        return config.get("version", "1.0.0")
    
    def get_enabled_modules(self) -> List[str]:
        """Get all enabled modules"""
        enabled_modules = []
        for category in MODULE_REGISTRY.values():
            for module_name, module_config in category.items():
                if module_config.get("enabled", False):
                    enabled_modules.append(module_name)
        return enabled_modules
    
    def get_module_info(self, module_name: str) -> Dict[str, Any]:
        """Get comprehensive module information"""
        module = self.get_module(module_name)
        config = self.get_module_config(module_name)
        
        if not config:
            return {}
        
        return {
            "name": module_name,
            "enabled": config.get("enabled", False),
            "version": config.get("version", "1.0.0"),
            "dependencies": config.get("dependencies", []),
            "config": config.get("config", {}),
            "instance": module is not None,
            "extensions": [ext.name for ext in module.get_extensions()] if module else []
        }

# Global module registry instance
module_registry = ModuleRegistry()



