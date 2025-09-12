from typing import Dict, Any, List, Optional
from datetime import datetime
from app.core.config import Config

class DatabaseService:
    """Database service for EVEP Platform"""
    
    def __init__(self):
        self.config = Config.get_module_config("database")
        self.connection_string = self.config.get("config", {}).get("connection_string", "mongodb://localhost:27017")
        self.database_name = self.config.get("config", {}).get("database_name", "evep_platform")
        
        # In-memory storage for demonstration
        self.collections = {}
        self.backups = {}
        self.connection_status = "disconnected"
    
    async def initialize(self) -> None:
        """Initialize the database service"""
        # In a real implementation, this would connect to MongoDB
        # For now, we'll use in-memory storage for demonstration
        self.connection_status = "connected"
        
        # Initialize collections
        self.collections = {
            "users": [],
            "admin_users": [],
            "medical_staff_users": [],
            "patients": [],
            "screenings": [],
            "school_screenings": [],
            "audit_logs": [],
            "system_settings": []
        }
        
        print(f"🔧 Database service initialized: {self.database_name}")
    
    async def get_status(self) -> Dict[str, Any]:
        """Get database status and health"""
        return {
            "status": self.connection_status,
            "database_name": self.database_name,
            "connection_string": self.connection_string,
            "collections_count": len(self.collections),
            "total_documents": sum(len(docs) for docs in self.collections.values()),
            "last_backup": self._get_last_backup_info(),
            "uptime": self._get_uptime(),
            "health": "healthy" if self.connection_status == "connected" else "unhealthy"
        }
    
    async def create_backup(self) -> Dict[str, Any]:
        """Create a database backup"""
        backup_id = f"backup_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        
        # Create backup data
        backup_data = {
            "id": backup_id,
            "timestamp": datetime.utcnow(),
            "collections": {},
            "metadata": {
                "version": "1.0.0",
                "total_documents": 0,
                "created_by": "system"
            }
        }
        
        # Backup each collection
        total_documents = 0
        for collection_name, documents in self.collections.items():
            backup_data["collections"][collection_name] = documents.copy()
            total_documents += len(documents)
        
        backup_data["metadata"]["total_documents"] = total_documents
        
        # Store backup
        self.backups[backup_id] = backup_data
        
        return {
            "backup_id": backup_id,
            "timestamp": backup_data["timestamp"],
            "total_documents": total_documents,
            "collections": list(self.collections.keys()),
            "size_mb": self._estimate_backup_size(backup_data)
        }
    
    async def restore_backup(self, backup_id: str) -> Dict[str, Any]:
        """Restore database from backup"""
        if backup_id not in self.backups:
            raise ValueError(f"Backup {backup_id} not found")
        
        backup_data = self.backups[backup_id]
        
        # Restore collections
        restored_collections = []
        total_documents = 0
        
        for collection_name, documents in backup_data["collections"].items():
            if collection_name in self.collections:
                self.collections[collection_name] = documents.copy()
                restored_collections.append(collection_name)
                total_documents += len(documents)
        
        return {
            "backup_id": backup_id,
            "timestamp": backup_data["timestamp"],
            "restored_collections": restored_collections,
            "total_documents": total_documents,
            "restore_timestamp": datetime.utcnow()
        }
    
    async def cleanup(self) -> Dict[str, Any]:
        """Clean up database (remove old data, optimize indexes)"""
        cleanup_results = {
            "timestamp": datetime.utcnow(),
            "operations": [],
            "documents_removed": 0,
            "collections_optimized": 0
        }
        
        # Clean up old audit logs (older than 90 days)
        if "audit_logs" in self.collections:
            old_count = len(self.collections["audit_logs"])
            # In a real implementation, this would filter by date
            # For demo, we'll just remove some documents
            if old_count > 100:
                self.collections["audit_logs"] = self.collections["audit_logs"][-100:]
                removed = old_count - 100
                cleanup_results["documents_removed"] += removed
                cleanup_results["operations"].append({
                    "operation": "cleanup_audit_logs",
                    "documents_removed": removed
                })
        
        # Clean up old backups (keep only last 5)
        if len(self.backups) > 5:
            backup_ids = sorted(self.backups.keys())
            old_backups = backup_ids[:-5]
            for backup_id in old_backups:
                del self.backups[backup_id]
                cleanup_results["operations"].append({
                    "operation": "remove_old_backup",
                    "backup_id": backup_id
                })
        
        # Optimize collections (in a real implementation, this would optimize indexes)
        for collection_name in self.collections:
            cleanup_results["collections_optimized"] += 1
            cleanup_results["operations"].append({
                "operation": "optimize_collection",
                "collection": collection_name
            })
        
        return cleanup_results
    
    async def get_collection_info(self, collection_name: str) -> Optional[Dict[str, Any]]:
        """Get information about a specific collection"""
        if collection_name not in self.collections:
            return None
        
        documents = self.collections[collection_name]
        
        return {
            "name": collection_name,
            "document_count": len(documents),
            "size_bytes": self._estimate_collection_size(documents),
            "indexes": self._get_collection_indexes(collection_name),
            "last_updated": self._get_last_updated(collection_name)
        }
    
    async def get_backups(self) -> List[Dict[str, Any]]:
        """Get list of available backups"""
        backups = []
        for backup_id, backup_data in self.backups.items():
            backups.append({
                "id": backup_id,
                "timestamp": backup_data["timestamp"],
                "total_documents": backup_data["metadata"]["total_documents"],
                "size_mb": self._estimate_backup_size(backup_data)
            })
        
        return sorted(backups, key=lambda x: x["timestamp"], reverse=True)
    
    async def delete_backup(self, backup_id: str) -> bool:
        """Delete a backup"""
        if backup_id in self.backups:
            del self.backups[backup_id]
            return True
        return False
    
    # Helper methods
    def _get_last_backup_info(self) -> Optional[Dict[str, Any]]:
        """Get information about the last backup"""
        if not self.backups:
            return None
        
        latest_backup_id = max(self.backups.keys())
        backup_data = self.backups[latest_backup_id]
        
        return {
            "id": latest_backup_id,
            "timestamp": backup_data["timestamp"],
            "total_documents": backup_data["metadata"]["total_documents"]
        }
    
    def _get_uptime(self) -> str:
        """Get database uptime (simulated)"""
        # In a real implementation, this would track actual uptime
        return "24h 15m 30s"
    
    def _estimate_backup_size(self, backup_data: Dict[str, Any]) -> float:
        """Estimate backup size in MB"""
        # Simple estimation based on document count
        total_docs = backup_data["metadata"]["total_documents"]
        return round(total_docs * 0.001, 2)  # ~1KB per document
    
    def _estimate_collection_size(self, documents: List[Dict[str, Any]]) -> int:
        """Estimate collection size in bytes"""
        # Simple estimation
        return len(documents) * 1024  # ~1KB per document
    
    def _get_collection_indexes(self, collection_name: str) -> List[Dict[str, Any]]:
        """Get indexes for a collection"""
        # In a real implementation, this would query MongoDB indexes
        common_indexes = [
            {"name": "_id_", "key": {"_id": 1}, "unique": True},
            {"name": "created_at_1", "key": {"created_at": 1}},
            {"name": "updated_at_1", "key": {"updated_at": 1}}
        ]
        
        # Add collection-specific indexes
        if collection_name == "users":
            common_indexes.append({"name": "email_1", "key": {"email": 1}, "unique": True})
        elif collection_name == "patients":
            common_indexes.append({"name": "patient_id_1", "key": {"patient_id": 1}, "unique": True})
        
        return common_indexes
    
    def _get_last_updated(self, collection_name: str) -> Optional[datetime]:
        """Get last update time for a collection"""
        if collection_name not in self.collections or not self.collections[collection_name]:
            return None
        
        # In a real implementation, this would query the actual last document
        return datetime.utcnow()



