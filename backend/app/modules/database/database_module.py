from abc import ABC
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends
from app.core.base_module import BaseModule
from app.core.config import Config
from app.core.event_bus import event_bus
from app.modules.database.services.database_service import DatabaseService
from app.modules.database.services.collection_service import CollectionService
from app.modules.database.services.migration_service import MigrationService

class DatabaseModule(BaseModule):
    """Database module for EVEP Platform"""
    
    def __init__(self):
        super().__init__()
        self.name = "database"
        self.version = "1.0.0"
        self.description = "Database operations and management"
        
        # Initialize services
        self.database_service = DatabaseService()
        self.collection_service = CollectionService()
        self.migration_service = MigrationService()
        
        # Setup router
        self.router = APIRouter(prefix="/api/v1/database", tags=["database"])
        self._setup_routes()
    
    async def initialize(self) -> None:
        """Initialize the database module"""
        print(f"🔧 Initializing {self.name} module v{self.version}")
        
        # Initialize services
        await self.database_service.initialize()
        await self.collection_service.initialize()
        await self.migration_service.initialize()
        
        # Subscribe to events
        event_bus.subscribe("database.backup", self._handle_backup_request)
        event_bus.subscribe("database.restore", self._handle_restore_request)
        event_bus.subscribe("database.migrate", self._handle_migration_request)
        event_bus.subscribe("database.cleanup", self._handle_cleanup_request)
        
        print(f"✅ {self.name} module initialized successfully")
    
    def get_router(self) -> APIRouter:
        """Get the database module router"""
        return self.router
    
    def get_events(self) -> List[str]:
        """Get events that this module subscribes to"""
        return [
            "database.backup",
            "database.restore", 
            "database.migrate",
            "database.cleanup"
        ]
    
    def _setup_routes(self) -> None:
        """Setup database API routes"""
        
        @self.router.get("/status")
        async def get_database_status():
            """Get database status and health"""
            try:
                status = await self.database_service.get_status()
                return {
                    "status": "success",
                    "data": status,
                    "message": "Database status retrieved successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/collections")
        async def get_collections():
            """Get all database collections"""
            try:
                collections = await self.collection_service.get_all_collections()
                return {
                    "status": "success",
                    "data": collections,
                    "message": "Collections retrieved successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/collections/{collection_name}/stats")
        async def get_collection_stats(collection_name: str):
            """Get statistics for a specific collection"""
            try:
                stats = await self.collection_service.get_collection_stats(collection_name)
                return {
                    "status": "success",
                    "data": stats,
                    "message": f"Statistics for {collection_name} retrieved successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.post("/backup")
        async def create_backup():
            """Create a database backup"""
            try:
                backup_info = await self.database_service.create_backup()
                return {
                    "status": "success",
                    "data": backup_info,
                    "message": "Database backup created successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.post("/restore")
        async def restore_backup(backup_id: str):
            """Restore database from backup"""
            try:
                restore_info = await self.database_service.restore_backup(backup_id)
                return {
                    "status": "success",
                    "data": restore_info,
                    "message": "Database restored successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/migrations")
        async def get_migrations():
            """Get available migrations"""
            try:
                migrations = await self.migration_service.get_migrations()
                return {
                    "status": "success",
                    "data": migrations,
                    "message": "Migrations retrieved successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.post("/migrations/run")
        async def run_migrations():
            """Run pending migrations"""
            try:
                migration_results = await self.migration_service.run_migrations()
                return {
                    "status": "success",
                    "data": migration_results,
                    "message": "Migrations completed successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.post("/cleanup")
        async def cleanup_database():
            """Clean up database (remove old data, optimize indexes)"""
            try:
                cleanup_results = await self.database_service.cleanup()
                return {
                    "status": "success",
                    "data": cleanup_results,
                    "message": "Database cleanup completed successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
    
    async def _handle_backup_request(self, data: Dict[str, Any]) -> None:
        """Handle database backup requests"""
        try:
            backup_info = await self.database_service.create_backup()
            await event_bus.emit("notification.send", {
                "type": "database_backup_completed",
                "data": backup_info,
                "user_id": data.get("user_id")
            })
        except Exception as e:
            await event_bus.emit("notification.send", {
                "type": "database_backup_failed",
                "error": str(e),
                "user_id": data.get("user_id")
            })
    
    async def _handle_restore_request(self, data: Dict[str, Any]) -> None:
        """Handle database restore requests"""
        try:
            backup_id = data.get("backup_id")
            restore_info = await self.database_service.restore_backup(backup_id)
            await event_bus.emit("notification.send", {
                "type": "database_restore_completed",
                "data": restore_info,
                "user_id": data.get("user_id")
            })
        except Exception as e:
            await event_bus.emit("notification.send", {
                "type": "database_restore_failed",
                "error": str(e),
                "user_id": data.get("user_id")
            })
    
    async def _handle_migration_request(self, data: Dict[str, Any]) -> None:
        """Handle database migration requests"""
        try:
            migration_results = await self.migration_service.run_migrations()
            await event_bus.emit("notification.send", {
                "type": "database_migration_completed",
                "data": migration_results,
                "user_id": data.get("user_id")
            })
        except Exception as e:
            await event_bus.emit("notification.send", {
                "type": "database_migration_failed",
                "error": str(e),
                "user_id": data.get("user_id")
            })
    
    async def _handle_cleanup_request(self, data: Dict[str, Any]) -> None:
        """Handle database cleanup requests"""
        try:
            cleanup_results = await self.database_service.cleanup()
            await event_bus.emit("notification.send", {
                "type": "database_cleanup_completed",
                "data": cleanup_results,
                "user_id": data.get("user_id")
            })
        except Exception as e:
            await event_bus.emit("notification.send", {
                "type": "database_cleanup_failed",
                "error": str(e),
                "user_id": data.get("user_id")
            })



