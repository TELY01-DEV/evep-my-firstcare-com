from typing import Dict, Any, List, Optional
from datetime import datetime
from app.core.config import Config

class DemographicsService:
    """Demographics service for EVEP Platform"""
    
    def __init__(self):
        self.config = Config.get_module_config("patient_management")
        
        # In-memory storage for demonstration
        self.demographics = {}
    
    async def initialize(self) -> None:
        """Initialize the demographics service"""
        print("🔧 Demographics service initialized")
    
    async def get_patient_demographics(self, patient_id: str) -> Optional[Dict[str, Any]]:
        """Get demographics for a specific patient"""
        return self.demographics.get(patient_id)
    
    async def update_patient_demographics(
        self, 
        patient_id: str, 
        demographics_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update demographics for a specific patient"""
        # Validate required fields
        required_fields = ["age", "gender", "ethnicity"]
        for field in required_fields:
            if field not in demographics_data:
                raise ValueError(f"Missing required field: {field}")
        
        # Create or update demographics
        if patient_id not in self.demographics:
            self.demographics[patient_id] = {
                "patient_id": patient_id,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        
        # Update demographics
        old_data = self.demographics[patient_id].copy()
        self.demographics[patient_id].update(demographics_data)
        self.demographics[patient_id]["updated_at"] = datetime.utcnow()
        
        # Track changes
        changes = {}
        for key, new_value in demographics_data.items():
            if key in old_data and old_data[key] != new_value:
                changes[key] = {"old": old_data[key], "new": new_value}
        
        return self.demographics[patient_id]
    
    async def get_demographics_statistics(self) -> Dict[str, Any]:
        """Get demographics statistics"""
        if not self.demographics:
            return {
                "total_records": 0,
                "age_distribution": {},
                "gender_distribution": {},
                "ethnicity_distribution": {},
                "last_updated": datetime.utcnow()
            }
        
        # Age distribution
        age_groups = {"0-5": 0, "6-12": 0, "13-18": 0, "19-30": 0, "31-50": 0, "51+": 0}
        gender_counts = {}
        ethnicity_counts = {}
        
        for demographics in self.demographics.values():
            # Age distribution
            age = demographics.get("age", 0)
            if age <= 5:
                age_groups["0-5"] += 1
            elif age <= 12:
                age_groups["6-12"] += 1
            elif age <= 18:
                age_groups["13-18"] += 1
            elif age <= 30:
                age_groups["19-30"] += 1
            elif age <= 50:
                age_groups["31-50"] += 1
            else:
                age_groups["51+"] += 1
            
            # Gender distribution
            gender = demographics.get("gender", "Unknown")
            gender_counts[gender] = gender_counts.get(gender, 0) + 1
            
            # Ethnicity distribution
            ethnicity = demographics.get("ethnicity", "Unknown")
            ethnicity_counts[ethnicity] = ethnicity_counts.get(ethnicity, 0) + 1
        
        return {
            "total_records": len(self.demographics),
            "age_distribution": age_groups,
            "gender_distribution": gender_counts,
            "ethnicity_distribution": ethnicity_counts,
            "last_updated": datetime.utcnow()
        }
    
    async def get_demographics_by_age_range(self, min_age: int, max_age: int) -> List[Dict[str, Any]]:
        """Get demographics for patients within a specific age range"""
        results = []
        
        for demographics in self.demographics.values():
            age = demographics.get("age", 0)
            if min_age <= age <= max_age:
                results.append(demographics)
        
        return results
    
    async def get_demographics_by_gender(self, gender: str) -> List[Dict[str, Any]]:
        """Get demographics for patients of a specific gender"""
        results = []
        
        for demographics in self.demographics.values():
            if demographics.get("gender", "").lower() == gender.lower():
                results.append(demographics)
        
        return results
    
    async def get_demographics_by_ethnicity(self, ethnicity: str) -> List[Dict[str, Any]]:
        """Get demographics for patients of a specific ethnicity"""
        results = []
        
        for demographics in self.demographics.values():
            if demographics.get("ethnicity", "").lower() == ethnicity.lower():
                results.append(demographics)
        
        return results
    
    async def add_demographics_field(self, patient_id: str, field_name: str, field_value: Any) -> Optional[Dict[str, Any]]:
        """Add a specific field to patient demographics"""
        if patient_id not in self.demographics:
            self.demographics[patient_id] = {
                "patient_id": patient_id,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        
        self.demographics[patient_id][field_name] = field_value
        self.demographics[patient_id]["updated_at"] = datetime.utcnow()
        
        return self.demographics[patient_id]
    
    async def remove_demographics_field(self, patient_id: str, field_name: str) -> bool:
        """Remove a specific field from patient demographics"""
        if patient_id not in self.demographics:
            return False
        
        if field_name in self.demographics[patient_id]:
            del self.demographics[patient_id][field_name]
            self.demographics[patient_id]["updated_at"] = datetime.utcnow()
            return True
        
        return False
    
    async def get_demographics_fields(self) -> List[str]:
        """Get all unique field names used in demographics"""
        fields = set()
        
        for demographics in self.demographics.values():
            fields.update(demographics.keys())
        
        # Remove system fields
        system_fields = {"patient_id", "created_at", "updated_at"}
        fields = fields - system_fields
        
        return list(fields)
    
    async def export_demographics_data(self, format: str = "json") -> Dict[str, Any]:
        """Export demographics data in specified format"""
        if format.lower() == "json":
            return {
                "format": "json",
                "total_records": len(self.demographics),
                "data": self.demographics,
                "exported_at": datetime.utcnow()
            }
        elif format.lower() == "csv":
            # In a real implementation, this would generate CSV data
            return {
                "format": "csv",
                "total_records": len(self.demographics),
                "data": "CSV data would be generated here",
                "exported_at": datetime.utcnow()
            }
        else:
            raise ValueError(f"Unsupported format: {format}")
    
    async def import_demographics_data(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Import demographics data"""
        imported_count = 0
        updated_count = 0
        errors = []
        
        for record in data:
            try:
                patient_id = record.get("patient_id")
                if not patient_id:
                    errors.append("Missing patient_id in record")
                    continue
                
                if patient_id in self.demographics:
                    # Update existing record
                    self.demographics[patient_id].update(record)
                    self.demographics[patient_id]["updated_at"] = datetime.utcnow()
                    updated_count += 1
                else:
                    # Create new record
                    record["created_at"] = datetime.utcnow()
                    record["updated_at"] = datetime.utcnow()
                    self.demographics[patient_id] = record
                    imported_count += 1
                
            except Exception as e:
                errors.append(f"Error processing record: {str(e)}")
        
        return {
            "imported_count": imported_count,
            "updated_count": updated_count,
            "errors": errors,
            "total_processed": len(data)
        }
    
    async def validate_demographics_data(self, demographics_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate demographics data"""
        validation_result = {
            "is_valid": True,
            "errors": [],
            "warnings": []
        }
        
        # Check required fields
        required_fields = ["age", "gender", "ethnicity"]
        for field in required_fields:
            if field not in demographics_data:
                validation_result["is_valid"] = False
                validation_result["errors"].append(f"Missing required field: {field}")
        
        # Validate age
        if "age" in demographics_data:
            age = demographics_data["age"]
            if not isinstance(age, int) or age < 0 or age > 150:
                validation_result["is_valid"] = False
                validation_result["errors"].append("Age must be a positive integer between 0 and 150")
        
        # Validate gender
        if "gender" in demographics_data:
            gender = demographics_data["gender"]
            valid_genders = ["male", "female", "other", "prefer_not_to_say"]
            if gender.lower() not in valid_genders:
                validation_result["warnings"].append(f"Gender '{gender}' is not in standard list")
        
        # Validate ethnicity
        if "ethnicity" in demographics_data:
            ethnicity = demographics_data["ethnicity"]
            if not isinstance(ethnicity, str) or len(ethnicity.strip()) == 0:
                validation_result["is_valid"] = False
                validation_result["errors"].append("Ethnicity must be a non-empty string")
        
        return validation_result



