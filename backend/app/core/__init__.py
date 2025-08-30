# EVEP Platform - Core Module
# This module contains the core functionality for the modular architecture

from .config import Config, MODULE_REGISTRY, FEATURE_FLAGS
from .module_registry import ModuleRegistry, module_registry
from .base_module import BaseModule
from .event_bus import EventBus, event_bus
from .feature_flags import FeatureFlags

__all__ = [
    'Config',
    'MODULE_REGISTRY', 
    'FEATURE_FLAGS',
    'ModuleRegistry',
    'module_registry',
    'BaseModule',
    'EventBus',
    'event_bus',
    'FeatureFlags'
]



