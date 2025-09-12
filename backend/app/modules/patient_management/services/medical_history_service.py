from typing import Dict, Any, List, Optional
from datetime import datetime
from app.core.config import Config

class MedicalHistoryService:
    """Medical History service for EVEP Platform"""
    
    def __init__(self):
        self.config = Config.get_module_config("patient_management")
        
        # In-memory storage for demonstration
        self.medical_histories = {}
    
    async def initialize(self) -> None:
        """Initialize the medical history service"""
        print("🔧 Medical History service initialized")
    
    async def get_patient_medical_history(self, patient_id: str) -> Optional[Dict[str, Any]]:
        """Get medical history for a specific patient"""
        return self.medical_histories.get(patient_id)
    
    async def add_medical_history_entry(
        self, 
        patient_id: str, 
        entry_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Add a medical history entry for a patient"""
        # Validate required fields
        required_fields = ["condition", "diagnosis_date", "severity"]
        for field in required_fields:
            if field not in entry_data:
                raise ValueError(f"Missing required field: {field}")
        
        # Create or get medical history
        if patient_id not in self.medical_histories:
            self.medical_histories[patient_id] = {
                "patient_id": patient_id,
                "entries": [],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        
        # Create entry
        entry = {
            "id": f"entry_{len(self.medical_histories[patient_id]['entries']) + 1}",
            "condition": entry_data["condition"],
            "diagnosis_date": entry_data["diagnosis_date"],
            "severity": entry_data["severity"],
            "description": entry_data.get("description", ""),
            "treatments": entry_data.get("treatments", []),
            "medications": entry_data.get("medications", []),
            "allergies": entry_data.get("allergies", []),
            "family_history": entry_data.get("family_history", False),
            "notes": entry_data.get("notes", ""),
            "created_at": datetime.utcnow()
        }
        
        # Add entry to history
        self.medical_histories[patient_id]["entries"].append(entry)
        self.medical_histories[patient_id]["updated_at"] = datetime.utcnow()
        
        return entry
    
    async def update_medical_history_entry(
        self, 
        patient_id: str, 
        entry_id: str, 
        updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update a specific medical history entry"""
        if patient_id not in self.medical_histories:
            return None
        
        # Find the entry
        entry = None
        for e in self.medical_histories[patient_id]["entries"]:
            if e["id"] == entry_id:
                entry = e
                break
        
        if not entry:
            return None
        
        # Update entry
        old_data = entry.copy()
        for key, value in updates.items():
            if key in entry:
                entry[key] = value
        
        entry["updated_at"] = datetime.utcnow()
        self.medical_histories[patient_id]["updated_at"] = datetime.utcnow()
        
        return entry
    
    async def delete_medical_history_entry(self, patient_id: str, entry_id: str) -> bool:
        """Delete a specific medical history entry"""
        if patient_id not in self.medical_histories:
            return False
        
        # Find and remove the entry
        entries = self.medical_histories[patient_id]["entries"]
        for i, entry in enumerate(entries):
            if entry["id"] == entry_id:
                del entries[i]
                self.medical_histories[patient_id]["updated_at"] = datetime.utcnow()
                return True
        
        return False
    
    async def get_medical_history_by_condition(self, patient_id: str, condition: str) -> List[Dict[str, Any]]:
        """Get medical history entries for a specific condition"""
        if patient_id not in self.medical_histories:
            return []
        
        condition_lower = condition.lower()
        return [
            entry for entry in self.medical_histories[patient_id]["entries"]
            if condition_lower in entry["condition"].lower()
        ]
    
    async def get_medical_history_by_severity(self, patient_id: str, severity: str) -> List[Dict[str, Any]]:
        """Get medical history entries by severity"""
        if patient_id not in self.medical_histories:
            return []
        
        severity_lower = severity.lower()
        return [
            entry for entry in self.medical_histories[patient_id]["entries"]
            if severity_lower == entry["severity"].lower()
        ]
    
    async def get_medical_history_by_date_range(
        self, 
        patient_id: str, 
        start_date: str, 
        end_date: str
    ) -> List[Dict[str, Any]]:
        """Get medical history entries within a date range"""
        if patient_id not in self.medical_histories:
            return []
        
        start = datetime.strptime(start_date, "%Y-%m-%d").date()
        end = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        return [
            entry for entry in self.medical_histories[patient_id]["entries"]
            if start <= datetime.strptime(entry["diagnosis_date"], "%Y-%m-%d").date() <= end
        ]
    
    async def get_medical_history_statistics(self, patient_id: str) -> Dict[str, Any]:
        """Get medical history statistics for a patient"""
        if patient_id not in self.medical_histories:
            return {
                "total_entries": 0,
                "conditions": {},
                "severity_distribution": {},
                "family_history_count": 0,
                "allergies_count": 0,
                "last_updated": None
            }
        
        history = self.medical_histories[patient_id]
        entries = history["entries"]
        
        # Condition distribution
        conditions = {}
        for entry in entries:
            condition = entry["condition"]
            conditions[condition] = conditions.get(condition, 0) + 1
        
        # Severity distribution
        severity_counts = {}
        for entry in entries:
            severity = entry["severity"]
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        # Family history count
        family_history_count = sum(1 for entry in entries if entry.get("family_history", False))
        
        # Allergies count
        allergies_count = sum(len(entry.get("allergies", [])) for entry in entries)
        
        return {
            "total_entries": len(entries),
            "conditions": conditions,
            "severity_distribution": severity_counts,
            "family_history_count": family_history_count,
            "allergies_count": allergies_count,
            "last_updated": history["updated_at"]
        }
    
    async def get_allergies_summary(self, patient_id: str) -> List[str]:
        """Get all allergies for a patient"""
        if patient_id not in self.medical_histories:
            return []
        
        allergies = set()
        for entry in self.medical_histories[patient_id]["entries"]:
            allergies.update(entry.get("allergies", []))
        
        return list(allergies)
    
    async def get_medications_summary(self, patient_id: str) -> List[str]:
        """Get all medications for a patient"""
        if patient_id not in self.medical_histories:
            return []
        
        medications = set()
        for entry in self.medical_histories[patient_id]["entries"]:
            medications.update(entry.get("medications", []))
        
        return list(medications)
    
    async def get_treatments_summary(self, patient_id: str) -> List[str]:
        """Get all treatments for a patient"""
        if patient_id not in self.medical_histories:
            return []
        
        treatments = set()
        for entry in self.medical_histories[patient_id]["entries"]:
            treatments.update(entry.get("treatments", []))
        
        return list(treatments)
    
    async def add_allergy(self, patient_id: str, allergy: str) -> bool:
        """Add an allergy to a patient's medical history"""
        if patient_id not in self.medical_histories:
            return False
        
        # Add to the most recent entry or create a new entry
        entries = self.medical_histories[patient_id]["entries"]
        if entries:
            if "allergies" not in entries[-1]:
                entries[-1]["allergies"] = []
            if allergy not in entries[-1]["allergies"]:
                entries[-1]["allergies"].append(allergy)
                self.medical_histories[patient_id]["updated_at"] = datetime.utcnow()
                return True
        
        return False
    
    async def add_medication(self, patient_id: str, medication: str) -> bool:
        """Add a medication to a patient's medical history"""
        if patient_id not in self.medical_histories:
            return False
        
        # Add to the most recent entry or create a new entry
        entries = self.medical_histories[patient_id]["entries"]
        if entries:
            if "medications" not in entries[-1]:
                entries[-1]["medications"] = []
            if medication not in entries[-1]["medications"]:
                entries[-1]["medications"].append(medication)
                self.medical_histories[patient_id]["updated_at"] = datetime.utcnow()
                return True
        
        return False
    
    async def export_medical_history(self, patient_id: str, format: str = "json") -> Dict[str, Any]:
        """Export medical history for a patient"""
        if patient_id not in self.medical_histories:
            return {
                "patient_id": patient_id,
                "format": format,
                "data": None,
                "message": "No medical history found"
            }
        
        if format.lower() == "json":
            return {
                "patient_id": patient_id,
                "format": "json",
                "data": self.medical_histories[patient_id],
                "exported_at": datetime.utcnow()
            }
        elif format.lower() == "csv":
            # In a real implementation, this would generate CSV data
            return {
                "patient_id": patient_id,
                "format": "csv",
                "data": "CSV data would be generated here",
                "exported_at": datetime.utcnow()
            }
        else:
            raise ValueError(f"Unsupported format: {format}")
    
    async def validate_medical_history_entry(self, entry_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate medical history entry data"""
        validation_result = {
            "is_valid": True,
            "errors": [],
            "warnings": []
        }
        
        # Check required fields
        required_fields = ["condition", "diagnosis_date", "severity"]
        for field in required_fields:
            if field not in entry_data:
                validation_result["is_valid"] = False
                validation_result["errors"].append(f"Missing required field: {field}")
        
        # Validate diagnosis date
        if "diagnosis_date" in entry_data:
            try:
                datetime.strptime(entry_data["diagnosis_date"], "%Y-%m-%d")
            except ValueError:
                validation_result["is_valid"] = False
                validation_result["errors"].append("Invalid diagnosis date format. Use YYYY-MM-DD")
        
        # Validate severity
        if "severity" in entry_data:
            valid_severities = ["mild", "moderate", "severe", "critical"]
            if entry_data["severity"].lower() not in valid_severities:
                validation_result["warnings"].append(f"Severity '{entry_data['severity']}' is not in standard list")
        
        # Validate condition
        if "condition" in entry_data:
            condition = entry_data["condition"]
            if not isinstance(condition, str) or len(condition.strip()) == 0:
                validation_result["is_valid"] = False
                validation_result["errors"].append("Condition must be a non-empty string")
        
        return validation_result
    
    async def get_medical_history_summary(self, patient_id: str) -> Dict[str, Any]:
        """Get a summary of medical history for a patient"""
        if patient_id not in self.medical_histories:
            return {
                "patient_id": patient_id,
                "has_medical_history": False,
                "summary": "No medical history available"
            }
        
        history = self.medical_histories[patient_id]
        entries = history["entries"]
        
        if not entries:
            return {
                "patient_id": patient_id,
                "has_medical_history": True,
                "summary": "No medical conditions recorded"
            }
        
        # Get summary information
        total_conditions = len(set(entry["condition"] for entry in entries))
        active_conditions = len([e for e in entries if e.get("severity") in ["moderate", "severe", "critical"]])
        allergies = await self.get_allergies_summary(patient_id)
        medications = await self.get_medications_summary(patient_id)
        
        return {
            "patient_id": patient_id,
            "has_medical_history": True,
            "total_entries": len(entries),
            "total_conditions": total_conditions,
            "active_conditions": active_conditions,
            "allergies_count": len(allergies),
            "medications_count": len(medications),
            "last_updated": history["updated_at"],
            "summary": f"{total_conditions} conditions, {len(allergies)} allergies, {len(medications)} medications"
        }



