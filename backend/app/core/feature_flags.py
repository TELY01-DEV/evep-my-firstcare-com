from typing import Dict, Any, List
from .config import FEATURE_FLAGS

class FeatureFlags:
    _instance = None
    _flags: Dict[str, bool] = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._flags = FEATURE_FLAGS.copy()
        return cls._instance
    
    @classmethod
    def is_enabled(cls, feature: str) -> bool:
        """Check if a feature is enabled"""
        instance = cls()
        return instance._flags.get(feature, False)
    
    @classmethod
    def enable(cls, feature: str) -> None:
        """Enable a feature"""
        instance = cls()
        instance._flags[feature] = True
    
    @classmethod
    def disable(cls, feature: str) -> None:
        """Disable a feature"""
        instance = cls()
        instance._flags[feature] = False
    
    @classmethod
    def get_all_flags(cls) -> Dict[str, bool]:
        """Get all feature flags"""
        instance = cls()
        return instance._flags.copy()
    
    @classmethod
    def set_flags(cls, flags: Dict[str, bool]) -> None:
        """Set multiple feature flags"""
        instance = cls()
        instance._flags.update(flags)
    
    @classmethod
    def reset_to_defaults(cls) -> None:
        """Reset feature flags to default values"""
        instance = cls()
        instance._flags = FEATURE_FLAGS.copy()
    
    @classmethod
    def get_enabled_features(cls) -> List[str]:
        """Get list of enabled features"""
        instance = cls()
        return [feature for feature, enabled in instance._flags.items() if enabled]
    
    @classmethod
    def get_disabled_features(cls) -> List[str]:
        """Get list of disabled features"""
        instance = cls()
        return [feature for feature, enabled in instance._flags.items() if not enabled]

# Global feature flags instance
feature_flags = FeatureFlags()



