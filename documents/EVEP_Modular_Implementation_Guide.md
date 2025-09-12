# EVEP Platform - Modular Implementation Guide

## 🎯 **Overview**

This guide provides practical implementation steps for the EVEP Platform's modular architecture. It includes code examples, file structures, and step-by-step instructions for implementing the modular system.

---

## 📁 **Project Structure**

### **Backend Structure**
```
backend/
├── app/
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py              # Hardcoded configuration
│   │   ├── module_registry.py     # Module registry
│   │   ├── base_module.py         # Base module class
│   │   ├── event_bus.py           # Event system
│   │   └── feature_flags.py       # Feature flags
│   ├── modules/
│   │   ├── __init__.py
│   │   ├── auth/
│   │   │   ├── __init__.py
│   │   │   ├── auth_module.py
│   │   │   ├── services/
│   │   │   ├── api/
│   │   │   └── extensions/
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   ├── database_module.py
│   │   │   ├── collections/
│   │   │   ├── operations/
│   │   │   └── monitoring/
│   │   ├── patient_management/
│   │   │   ├── __init__.py
│   │   │   ├── patient_module.py
│   │   │   ├── services/
│   │   │   ├── api/
│   │   │   └── extensions/
│   │   ├── screening/
│   │   │   ├── __init__.py
│   │   │   ├── screening_module.py
│   │   │   ├── services/
│   │   │   ├── api/
│   │   │   └── extensions/
│   │   ├── reporting/
│   │   │   ├── __init__.py
│   │   │   ├── reporting_module.py
│   │   │   ├── services/
│   │   │   ├── api/
│   │   │   └── extensions/
│   │   └── notifications/
│   │       ├── __init__.py
│   │       ├── notification_module.py
│   │       ├── services/
│   │       ├── api/
│   │       └── extensions/
│   ├── shared/
│   │   ├── __init__.py
│   │   ├── models/
│   │   ├── services/
│   │   ├── utils/
│   │   └── middleware/
│   └── main.py
├── requirements.txt
└── docker-compose.yml
```

### **Frontend Structure**
```
frontend/
├── src/
│   ├── core/
│   │   ├── config/
│   │   │   ├── moduleRegistry.ts
│   │   │   ├── featureFlags.ts
│   │   │   └── appConfig.ts
│   │   ├── modules/
│   │   │   ├── BaseModule.ts
│   │   │   ├── ModuleFactory.ts
│   │   │   └── EventBus.ts
│   │   └── shared/
│   │       ├── types/
│   │       ├── services/
│   │       └── utils/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── AuthModule.ts
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── extensions/
│   │   ├── patient-management/
│   │   │   ├── PatientModule.ts
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── extensions/
│   │   ├── screening/
│   │   │   ├── ScreeningModule.ts
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── extensions/
│   │   └── reporting/
│   │       ├── ReportingModule.ts
│   │       ├── components/
│   │       ├── services/
│   │       └── extensions/
│   └── App.tsx
├── package.json
└── tsconfig.json
```

---

## 🔧 **Implementation Steps**

### **Step 1: Core Configuration System**

#### **1.1 Hardcoded Configuration (backend/app/core/config.py)**
```python
import os
from typing import Dict, Any, List

# Hardcoded module registry
MODULE_REGISTRY = {
    "core": {
        "auth": {
            "enabled": True,
            "version": "1.0.0",
            "dependencies": [],
            "config": {
                "jwt_secret": os.getenv("JWT_SECRET", "hardcoded_secret_key"),
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
        }
    }
}

# Feature flags
FEATURE_FLAGS = {
    "patient_management": True,
    "screening": True,
    "reporting": True,
    "notifications": True,
    "ai_analytics": False,
    "telemedicine": False,
    "mobile_app": False,
    "demographics": True,
    "insurance": False,
    "appointments": False,
    "vision_tests": True,
    "eye_pressure": False,
    "color_blindness": False
}

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
```

#### **1.2 Module Registry (backend/app/core/module_registry.py)**
```python
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

# Global module registry instance
module_registry = ModuleRegistry()
```

### **Step 2: Base Module Implementation**

#### **2.1 Base Module Class (backend/app/core/base_module.py)**
```python
from abc import ABC, abstractmethod
from typing import Dict, Any, List
from fastapi import APIRouter
from .module_registry import module_registry

class BaseModule(ABC):
    def __init__(self, module_name: str, config: Dict[str, Any]):
        self.module_name = module_name
        self.config = config
        self.dependencies = config.get("dependencies", [])
        self.extensions = []
        self.router = APIRouter()
        
        # Register module
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
```

### **Step 3: Event System Implementation**

#### **3.1 Event Bus (backend/app/core/event_bus.py)**
```python
from typing import Dict, List, Callable, Any
from collections import defaultdict
import asyncio
import logging

logger = logging.getLogger(__name__)

class EventBus:
    _instance = None
    _events: Dict[str, List[Callable]] = defaultdict(list)
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def subscribe(self, event: str, callback: Callable) -> None:
        """Subscribe to an event"""
        self._events[event].append(callback)
        logger.info(f"Subscribed to event: {event}")
    
    def unsubscribe(self, event: str, callback: Callable) -> None:
        """Unsubscribe from an event"""
        if event in self._events:
            self._events[event].remove(callback)
            logger.info(f"Unsubscribed from event: {event}")
    
    async def emit(self, event: str, data: Any = None) -> None:
        """Emit an event"""
        if event in self._events:
            logger.info(f"Emitting event: {event}")
            for callback in self._events[event]:
                try:
                    if asyncio.iscoroutinefunction(callback):
                        await callback(data)
                    else:
                        callback(data)
                except Exception as e:
                    logger.error(f"Error in event callback for {event}: {e}")
    
    def get_subscribers(self, event: str) -> List[Callable]:
        """Get subscribers for an event"""
        return self._events.get(event, [])
    
    def get_all_events(self) -> List[str]:
        """Get all registered events"""
        return list(self._events.keys())

# Global event bus instance
event_bus = EventBus()
```

### **Step 4: Module Implementation Examples**

#### **4.1 Patient Management Module (backend/app/modules/patient_management/patient_module.py)**
```python
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from app.core.base_module import BaseModule
from app.core.event_bus import event_bus
from app.shared.models.patient import Patient, PatientCreate, PatientUpdate
from .services.patient_service import PatientService
from .extensions.demographics_extension import DemographicsExtension

class PatientManagementModule(BaseModule):
    def __init__(self):
        config = self.get_module_config("patient_management")
        super().__init__("patient_management", config)
        
        # Initialize services
        self.patient_service = PatientService()
        
        # Initialize extensions
        self._initialize_extensions()
        
        # Setup routes
        self._setup_routes()
    
    async def initialize(self) -> None:
        """Initialize the module"""
        # Initialize services
        await self.patient_service.initialize()
        
        # Initialize extensions
        for extension in self.extensions:
            await extension.initialize()
        
        # Subscribe to events
        event_bus.subscribe("patient.created", self._handle_patient_created)
        event_bus.subscribe("patient.updated", self._handle_patient_updated)
        event_bus.subscribe("patient.deleted", self._handle_patient_deleted)
    
    def get_router(self) -> APIRouter:
        """Get the module's API router"""
        return self.router
    
    def get_events(self) -> List[str]:
        """Get list of events this module emits"""
        return [
            "patient.created",
            "patient.updated", 
            "patient.deleted",
            "patient.search",
            "patient.import",
            "patient.export"
        ]
    
    def _initialize_extensions(self) -> None:
        """Initialize module extensions"""
        extensions_config = self.config.get("extensions", {})
        
        # Demographics extension
        if extensions_config.get("demographics", {}).get("enabled", False):
            self.add_extension(DemographicsExtension())
        
        # Insurance extension (future)
        if extensions_config.get("insurance", {}).get("enabled", False):
            # self.add_extension(InsuranceExtension())
            pass
    
    def _setup_routes(self) -> None:
        """Setup API routes"""
        # Core patient routes
        self.router.get("/patients", self._get_all_patients)
        self.router.post("/patients", self._create_patient)
        self.router.get("/patients/{patient_id}", self._get_patient)
        self.router.put("/patients/{patient_id}", self._update_patient)
        self.router.delete("/patients/{patient_id}", self._delete_patient)
        
        # Extension routes
        for extension in self.extensions:
            extension_router = extension.get_router()
            self.router.include_router(
                extension_router,
                prefix=f"/patients/{extension.name}",
                tags=[f"patient-{extension.name}"]
            )
    
    # API endpoints
    async def _get_all_patients(self, skip: int = 0, limit: int = 100):
        patients = await self.patient_service.get_all_patients(skip, limit)
        return patients
    
    async def _create_patient(self, patient: PatientCreate):
        created_patient = await self.patient_service.create_patient(patient)
        await event_bus.emit("patient.created", created_patient)
        return created_patient
    
    async def _get_patient(self, patient_id: str):
        patient = await self.patient_service.get_patient(patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        return patient
    
    async def _update_patient(self, patient_id: str, patient: PatientUpdate):
        updated_patient = await self.patient_service.update_patient(patient_id, patient)
        await event_bus.emit("patient.updated", updated_patient)
        return updated_patient
    
    async def _delete_patient(self, patient_id: str):
        await self.patient_service.delete_patient(patient_id)
        await event_bus.emit("patient.deleted", {"patient_id": patient_id})
        return {"message": "Patient deleted"}
    
    # Event handlers
    async def _handle_patient_created(self, patient: Patient) -> None:
        """Handle patient created event"""
        # Log the event
        logger.info(f"Patient created: {patient.id}")
        
        # Trigger notifications
        await event_bus.emit("notification.send", {
            "type": "patient_created",
            "data": patient
        })
    
    async def _handle_patient_updated(self, patient: Patient) -> None:
        """Handle patient updated event"""
        logger.info(f"Patient updated: {patient.id}")
        
        # Update analytics
        await event_bus.emit("analytics.update", {
            "type": "patient_updated",
            "data": patient
        })
    
    async def _handle_patient_deleted(self, data: Dict[str, Any]) -> None:
        """Handle patient deleted event"""
        logger.info(f"Patient deleted: {data['patient_id']}")
        
        # Clean up related data
        await event_bus.emit("data.cleanup", {
            "type": "patient_deleted",
            "patient_id": data["patient_id"]
        })
```

#### **4.2 Demographics Extension (backend/app/modules/patient_management/extensions/demographics_extension.py)**
```python
from typing import Dict, Any
from fastapi import APIRouter
from app.shared.models.patient import Demographics

class DemographicsExtension:
    def __init__(self):
        self.name = "demographics"
        self.router = APIRouter()
        self._setup_routes()
    
    async def initialize(self) -> None:
        """Initialize the extension"""
        # Initialize demographics service
        pass
    
    def get_router(self) -> APIRouter:
        """Get the extension's API router"""
        return self.router
    
    def _setup_routes(self) -> None:
        """Setup API routes"""
        self.router.get("/", self._get_demographics)
        self.router.post("/", self._create_demographics)
        self.router.put("/{patient_id}", self._update_demographics)
    
    async def _get_demographics(self, patient_id: str):
        """Get patient demographics"""
        # Implementation here
        pass
    
    async def _create_demographics(self, patient_id: str, demographics: Demographics):
        """Create patient demographics"""
        # Implementation here
        pass
    
    async def _update_demographics(self, patient_id: str, demographics: Demographics):
        """Update patient demographics"""
        # Implementation here
        pass
```

### **Step 5: Main Application Setup**

#### **5.1 Main Application (backend/app/main.py)**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.module_registry import module_registry
from app.core.config import Config
from app.modules.auth.auth_module import AuthModule
from app.modules.database.database_module import DatabaseModule
from app.modules.patient_management.patient_module import PatientManagementModule
from app.modules.screening.screening_module import ScreeningModule

# Create FastAPI app
app = FastAPI(
    title="EVEP Platform API",
    description="Modular EVEP Platform API",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def initialize_modules():
    """Initialize all enabled modules"""
    enabled_modules = Config.get_enabled_modules()
    
    # Initialize core modules first
    core_modules = ["auth", "database"]
    for module_name in core_modules:
        if module_name in enabled_modules:
            await initialize_module(module_name)
    
    # Initialize feature modules
    feature_modules = [m for m in enabled_modules if m not in core_modules]
    for module_name in feature_modules:
        await initialize_module(module_name)

async def initialize_module(module_name: str):
    """Initialize a specific module"""
    module = None
    
    if module_name == "auth":
        module = AuthModule()
    elif module_name == "database":
        module = DatabaseModule()
    elif module_name == "patient_management":
        module = PatientManagementModule()
    elif module_name == "screening":
        module = ScreeningModule()
    
    if module:
        await module.initialize()
        app.include_router(
            module.get_router(),
            prefix=f"/api/v1/{module_name}",
            tags=[module_name]
        )

@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    await initialize_modules()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "modules": Config.get_enabled_modules()}

@app.get("/modules")
async def get_modules():
    """Get all modules information"""
    modules_info = {}
    for module_name in Config.get_enabled_modules():
        module = module_registry.get_module(module_name)
        if module:
            modules_info[module_name] = {
                "name": module_name,
                "config": module.config,
                "extensions": [ext.name for ext in module.get_extensions()],
                "events": module.get_events()
            }
    return modules_info
```

---

## 🎯 **Benefits of This Implementation**

### **1. Modularity**
- **Independent Modules**: Each module is self-contained
- **Easy Testing**: Test modules independently
- **Clear Separation**: Clear boundaries between modules

### **2. Extensibility**
- **Extension System**: Easy to add new features
- **Plugin Architecture**: Third-party integrations
- **Feature Flags**: Enable/disable features easily

### **3. Maintainability**
- **Organized Code**: Well-structured codebase
- **Clear Dependencies**: Explicit dependency management
- **Event-Driven**: Loose coupling between modules

### **4. Scalability**
- **Horizontal Scaling**: Add new modules easily
- **Vertical Scaling**: Enhance existing modules
- **Performance**: Optimize each module independently

---

## 📝 **Next Steps**

### **Phase 1: Core Implementation**
1. Implement core configuration system
2. Create base module class
3. Implement event bus
4. Set up module registry

### **Phase 2: Module Development**
1. Implement authentication module
2. Implement database module
3. Implement patient management module
4. Implement screening module

### **Phase 3: Extension Development**
1. Create demographics extension
2. Create insurance extension
3. Create vision tests extension
4. Create analytics extension

### **Phase 4: Testing & Optimization**
1. Unit tests for each module
2. Integration tests
3. Performance optimization
4. Documentation

---

## 🎯 **Summary**

This modular implementation provides:

1. **Hardcoded Configuration**: Static configuration with environment overrides
2. **Modular Architecture**: Independent, expandable modules
3. **Extension System**: Plugin-based feature extensions
4. **Event-Driven Communication**: Loose coupling between modules
5. **Feature Flags**: Easy feature enable/disable
6. **Clear Structure**: Well-organized codebase
7. **Scalable Design**: Easy to add new features
8. **Maintainable Code**: Clear separation of concerns

**🔧 This implementation ensures the EVEP Platform can easily expand with new features while maintaining performance, security, and maintainability!**
