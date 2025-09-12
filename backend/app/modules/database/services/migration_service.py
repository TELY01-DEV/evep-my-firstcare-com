from typing import Dict, Any, List, Optional
from datetime import datetime
from app.core.config import Config

class MigrationService:
    """Migration service for EVEP Platform"""
    
    def __init__(self):
        self.config = Config.get_module_config("database")
        
        # Migration definitions
        self.migrations = [
            {
                "id": "001_initial_schema",
                "version": "1.0.0",
                "description": "Initial database schema",
                "applied": True,
                "applied_at": datetime.utcnow(),
                "dependencies": [],
                "operations": [
                    "Create users collection",
                    "Create admin_users collection",
                    "Create medical_staff_users collection",
                    "Create patients collection",
                    "Create screenings collection",
                    "Create school_screenings collection",
                    "Create audit_logs collection",
                    "Create system_settings collection"
                ]
            },
            {
                "id": "002_add_user_indexes",
                "version": "1.0.1",
                "description": "Add indexes for user collections",
                "applied": True,
                "applied_at": datetime.utcnow(),
                "dependencies": ["001_initial_schema"],
                "operations": [
                    "Create email index on users collection",
                    "Create role index on users collection",
                    "Create status index on users collection"
                ]
            },
            {
                "id": "003_add_patient_indexes",
                "version": "1.0.2",
                "description": "Add indexes for patient collections",
                "applied": False,
                "applied_at": None,
                "dependencies": ["001_initial_schema"],
                "operations": [
                    "Create patient_id index on patients collection",
                    "Create name index on patients collection",
                    "Create date_of_birth index on patients collection"
                ]
            },
            {
                "id": "004_add_screening_indexes",
                "version": "1.0.3",
                "description": "Add indexes for screening collections",
                "applied": False,
                "applied_at": None,
                "dependencies": ["001_initial_schema"],
                "operations": [
                    "Create screening_id index on screenings collection",
                    "Create patient_id index on screenings collection",
                    "Create conducted_by index on screenings collection",
                    "Create screening_date index on screenings collection"
                ]
            },
            {
                "id": "005_add_audit_indexes",
                "version": "1.0.4",
                "description": "Add indexes for audit logs",
                "applied": False,
                "applied_at": None,
                "dependencies": ["001_initial_schema"],
                "operations": [
                    "Create user_id index on audit_logs collection",
                    "Create action index on audit_logs collection",
                    "Create timestamp index on audit_logs collection"
                ]
            }
        ]
        
        # Migration history
        self.migration_history = []
    
    async def initialize(self) -> None:
        """Initialize the migration service"""
        print("🔧 Migration service initialized")
        
        # Load migration history
        await self._load_migration_history()
    
    async def get_migrations(self) -> List[Dict[str, Any]]:
        """Get all available migrations"""
        return self.migrations.copy()
    
    async def get_applied_migrations(self) -> List[Dict[str, Any]]:
        """Get applied migrations"""
        return [m for m in self.migrations if m["applied"]]
    
    async def get_pending_migrations(self) -> List[Dict[str, Any]]:
        """Get pending migrations"""
        return [m for m in self.migrations if not m["applied"]]
    
    async def run_migrations(self) -> Dict[str, Any]:
        """Run pending migrations"""
        pending_migrations = await self.get_pending_migrations()
        
        if not pending_migrations:
            return {
                "status": "success",
                "message": "No pending migrations",
                "migrations_applied": 0,
                "migrations_failed": 0,
                "results": []
            }
        
        results = {
            "status": "success",
            "message": "Migrations completed",
            "migrations_applied": 0,
            "migrations_failed": 0,
            "results": []
        }
        
        for migration in pending_migrations:
            try:
                # Check dependencies
                if not await self._check_dependencies(migration):
                    raise Exception(f"Dependencies not met for migration {migration['id']}")
                
                # Apply migration
                await self._apply_migration(migration)
                
                # Mark as applied
                migration["applied"] = True
                migration["applied_at"] = datetime.utcnow()
                
                # Add to history
                self.migration_history.append({
                    "migration_id": migration["id"],
                    "applied_at": migration["applied_at"],
                    "status": "success"
                })
                
                results["migrations_applied"] += 1
                results["results"].append({
                    "migration_id": migration["id"],
                    "status": "success",
                    "message": f"Migration {migration['id']} applied successfully"
                })
                
                print(f"✅ Applied migration: {migration['id']}")
                
            except Exception as e:
                results["migrations_failed"] += 1
                results["results"].append({
                    "migration_id": migration["id"],
                    "status": "failed",
                    "message": str(e)
                })
                
                print(f"❌ Failed migration: {migration['id']} - {str(e)}")
        
        # Update overall status
        if results["migrations_failed"] > 0:
            results["status"] = "partial"
            results["message"] = f"Some migrations failed ({results['migrations_failed']} failed, {results['migrations_applied']} applied)"
        
        return results
    
    async def rollback_migration(self, migration_id: str) -> Dict[str, Any]:
        """Rollback a specific migration"""
        migration = next((m for m in self.migrations if m["id"] == migration_id), None)
        
        if not migration:
            raise ValueError(f"Migration {migration_id} not found")
        
        if not migration["applied"]:
            raise ValueError(f"Migration {migration_id} is not applied")
        
        try:
            # Rollback migration
            await self._rollback_migration(migration)
            
            # Mark as not applied
            migration["applied"] = False
            migration["applied_at"] = None
            
            # Add to history
            self.migration_history.append({
                "migration_id": migration["id"],
                "applied_at": datetime.utcnow(),
                "status": "rolled_back"
            })
            
            return {
                "status": "success",
                "message": f"Migration {migration_id} rolled back successfully",
                "migration_id": migration_id
            }
            
        except Exception as e:
            return {
                "status": "failed",
                "message": f"Failed to rollback migration {migration_id}: {str(e)}",
                "migration_id": migration_id
            }
    
    async def get_migration_status(self) -> Dict[str, Any]:
        """Get migration status"""
        total_migrations = len(self.migrations)
        applied_migrations = len(await self.get_applied_migrations())
        pending_migrations = len(await self.get_pending_migrations())
        
        return {
            "total_migrations": total_migrations,
            "applied_migrations": applied_migrations,
            "pending_migrations": pending_migrations,
            "current_version": self._get_current_version(),
            "latest_version": self._get_latest_version(),
            "last_migration": self._get_last_migration()
        }
    
    async def create_migration(self, migration_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new migration"""
        # Validate migration data
        required_fields = ["id", "version", "description", "operations"]
        for field in required_fields:
            if field not in migration_data:
                raise ValueError(f"Missing required field: {field}")
        
        # Check if migration already exists
        if any(m["id"] == migration_data["id"] for m in self.migrations):
            raise ValueError(f"Migration {migration_data['id']} already exists")
        
        # Create migration
        migration = {
            "id": migration_data["id"],
            "version": migration_data["version"],
            "description": migration_data["description"],
            "applied": False,
            "applied_at": None,
            "dependencies": migration_data.get("dependencies", []),
            "operations": migration_data["operations"]
        }
        
        self.migrations.append(migration)
        
        return {
            "status": "success",
            "message": f"Migration {migration['id']} created successfully",
            "migration": migration
        }
    
    # Helper methods
    async def _load_migration_history(self) -> None:
        """Load migration history from storage"""
        # In a real implementation, this would load from database
        pass
    
    async def _check_dependencies(self, migration: Dict[str, Any]) -> bool:
        """Check if migration dependencies are met"""
        dependencies = migration.get("dependencies", [])
        
        for dep_id in dependencies:
            dep_migration = next((m for m in self.migrations if m["id"] == dep_id), None)
            if not dep_migration or not dep_migration["applied"]:
                return False
        
        return True
    
    async def _apply_migration(self, migration: Dict[str, Any]) -> None:
        """Apply a migration"""
        # In a real implementation, this would execute the actual migration operations
        # For now, we'll just simulate the operations
        
        operations = migration.get("operations", [])
        for operation in operations:
            # Simulate operation execution
            print(f"  🔧 Executing: {operation}")
            
            # In a real implementation, this would:
            # - Create collections
            # - Create indexes
            # - Modify schemas
            # - Update data
            pass
    
    async def _rollback_migration(self, migration: Dict[str, Any]) -> None:
        """Rollback a migration"""
        # In a real implementation, this would execute rollback operations
        # For now, we'll just simulate the rollback
        
        operations = migration.get("operations", [])
        for operation in operations:
            # Simulate rollback operation
            print(f"  🔄 Rolling back: {operation}")
            
            # In a real implementation, this would:
            # - Drop collections
            # - Drop indexes
            # - Restore schemas
            # - Restore data
            pass
    
    def _get_current_version(self) -> str:
        """Get current database version"""
        applied_migrations = [m for m in self.migrations if m["applied"]]
        if not applied_migrations:
            return "0.0.0"
        
        # Get the latest applied migration version
        latest = max(applied_migrations, key=lambda x: x["version"])
        return latest["version"]
    
    def _get_latest_version(self) -> str:
        """Get latest available version"""
        if not self.migrations:
            return "0.0.0"
        
        latest = max(self.migrations, key=lambda x: x["version"])
        return latest["version"]
    
    def _get_last_migration(self) -> Optional[Dict[str, Any]]:
        """Get the last applied migration"""
        applied_migrations = [m for m in self.migrations if m["applied"]]
        if not applied_migrations:
            return None
        
        # Get the most recently applied migration
        latest = max(applied_migrations, key=lambda x: x["applied_at"])
        return {
            "id": latest["id"],
            "version": latest["version"],
            "description": latest["description"],
            "applied_at": latest["applied_at"]
        }



