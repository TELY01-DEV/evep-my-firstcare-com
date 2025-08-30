from typing import Dict, Any, List, Optional
from datetime import datetime
from app.core.config import Config

class VisionTestService:
    """Vision Test service for EVEP Platform"""
    
    def __init__(self):
        self.config = Config.get_module_config("screening")
        
        # In-memory storage for demonstration
        self.vision_tests = {}
        self.test_counter = 0
    
    async def initialize(self) -> None:
        """Initialize the vision test service"""
        print("🔧 Vision Test service initialized")
    
    async def get_screening_vision_tests(self, screening_id: str) -> List[Dict[str, Any]]:
        """Get vision tests for a specific screening"""
        return [
            test for test in self.vision_tests.values()
            if test["screening_id"] == screening_id
        ]
    
    async def add_vision_test(self, screening_id: str, test_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Add a vision test to a screening"""
        # Validate required fields
        required_fields = ["test_type", "results"]
        for field in required_fields:
            if field not in test_data:
                raise ValueError(f"Missing required field: {field}")
        
        # Generate test ID
        self.test_counter += 1
        test_id = f"VT-{self.test_counter:06d}"
        
        # Create vision test
        vision_test = {
            "test_id": test_id,
            "screening_id": screening_id,
            "test_type": test_data["test_type"],
            "results": test_data["results"],
            "notes": test_data.get("notes", ""),
            "conducted_by": test_data.get("conducted_by", "system"),
            "test_date": test_data.get("test_date", datetime.utcnow().isoformat()),
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Store vision test
        self.vision_tests[test_id] = vision_test
        
        return vision_test
    
    async def get_vision_test(self, test_id: str) -> Optional[Dict[str, Any]]:
        """Get a vision test by ID"""
        return self.vision_tests.get(test_id)
    
    async def update_vision_test(self, test_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a vision test"""
        if test_id not in self.vision_tests:
            return None
        
        vision_test = self.vision_tests[test_id]
        
        # Update fields
        for key, value in updates.items():
            if key in vision_test:
                vision_test[key] = value
        
        vision_test["updated_at"] = datetime.utcnow().isoformat()
        
        return vision_test
    
    async def delete_vision_test(self, test_id: str) -> bool:
        """Delete a vision test"""
        if test_id not in self.vision_tests:
            return False
        
        del self.vision_tests[test_id]
        return True
    
    async def get_vision_tests_by_type(self, test_type: str) -> List[Dict[str, Any]]:
        """Get vision tests by type"""
        return [
            test for test in self.vision_tests.values()
            if test["test_type"] == test_type
        ]
    
    async def get_vision_tests_by_screening(self, screening_id: str) -> List[Dict[str, Any]]:
        """Get all vision tests for a screening"""
        return [
            test for test in self.vision_tests.values()
            if test["screening_id"] == screening_id
        ]
    
    async def get_vision_test_statistics(self, screening_id: str) -> Dict[str, Any]:
        """Get vision test statistics for a screening"""
        screening_tests = await self.get_vision_tests_by_screening(screening_id)
        
        if not screening_tests:
            return {
                "screening_id": screening_id,
                "total_tests": 0,
                "test_types": {},
                "results_summary": {},
                "last_updated": datetime.utcnow().isoformat()
            }
        
        # Test type distribution
        test_types = {}
        for test in screening_tests:
            test_type = test["test_type"]
            test_types[test_type] = test_types.get(test_type, 0) + 1
        
        # Results summary
        results_summary = {
            "normal": 0,
            "abnormal": 0,
            "requires_followup": 0
        }
        
        for test in screening_tests:
            results = test.get("results", {})
            if results.get("status") == "normal":
                results_summary["normal"] += 1
            elif results.get("status") == "abnormal":
                results_summary["abnormal"] += 1
            elif results.get("requires_followup", False):
                results_summary["requires_followup"] += 1
        
        return {
            "screening_id": screening_id,
            "total_tests": len(screening_tests),
            "test_types": test_types,
            "results_summary": results_summary,
            "last_updated": datetime.utcnow().isoformat()
        }
    
    async def validate_vision_test_data(self, test_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate vision test data"""
        validation_result = {
            "is_valid": True,
            "errors": [],
            "warnings": []
        }
        
        # Check required fields
        required_fields = ["test_type", "results"]
        for field in required_fields:
            if field not in test_data:
                validation_result["is_valid"] = False
                validation_result["errors"].append(f"Missing required field: {field}")
        
        # Validate test type
        if "test_type" in test_data:
            valid_test_types = [
                "visual_acuity",
                "color_vision",
                "depth_perception",
                "contrast_sensitivity",
                "visual_field",
                "refraction",
                "tonometry"
            ]
            if test_data["test_type"] not in valid_test_types:
                validation_result["warnings"].append(f"Test type '{test_data['test_type']}' is not in standard list")
        
        # Validate results
        if "results" in test_data:
            results = test_data["results"]
            if not isinstance(results, dict):
                validation_result["is_valid"] = False
                validation_result["errors"].append("Results must be a dictionary")
            else:
                # Check for required result fields based on test type
                test_type = test_data.get("test_type")
                if test_type == "visual_acuity":
                    if "acuity_value" not in results:
                        validation_result["warnings"].append("Visual acuity test should include acuity_value")
                elif test_type == "color_vision":
                    if "color_vision_result" not in results:
                        validation_result["warnings"].append("Color vision test should include color_vision_result")
        
        return validation_result
    
    async def get_vision_test_templates(self) -> Dict[str, Any]:
        """Get vision test templates for different test types"""
        templates = {
            "visual_acuity": {
                "test_type": "visual_acuity",
                "description": "Visual Acuity Test",
                "required_fields": ["acuity_value", "eye_tested"],
                "optional_fields": ["distance", "lighting_conditions", "notes"],
                "result_format": {
                    "acuity_value": "20/20",
                    "eye_tested": "both",
                    "distance": "6m",
                    "lighting_conditions": "normal",
                    "status": "normal|abnormal"
                }
            },
            "color_vision": {
                "test_type": "color_vision",
                "description": "Color Vision Test",
                "required_fields": ["color_vision_result"],
                "optional_fields": ["test_method", "notes"],
                "result_format": {
                    "color_vision_result": "normal|deficient",
                    "test_method": "ishihara|farnsworth",
                    "status": "normal|abnormal"
                }
            },
            "depth_perception": {
                "test_type": "depth_perception",
                "description": "Depth Perception Test",
                "required_fields": ["depth_perception_result"],
                "optional_fields": ["test_method", "notes"],
                "result_format": {
                    "depth_perception_result": "normal|reduced",
                    "test_method": "stereo_test|random_dot",
                    "status": "normal|abnormal"
                }
            },
            "contrast_sensitivity": {
                "test_type": "contrast_sensitivity",
                "description": "Contrast Sensitivity Test",
                "required_fields": ["contrast_sensitivity_value"],
                "optional_fields": ["spatial_frequency", "notes"],
                "result_format": {
                    "contrast_sensitivity_value": "1.5",
                    "spatial_frequency": "3cpd",
                    "status": "normal|abnormal"
                }
            },
            "visual_field": {
                "test_type": "visual_field",
                "description": "Visual Field Test",
                "required_fields": ["visual_field_result"],
                "optional_fields": ["test_method", "notes"],
                "result_format": {
                    "visual_field_result": "normal|defect",
                    "test_method": "confrontation|automated",
                    "status": "normal|abnormal"
                }
            },
            "refraction": {
                "test_type": "refraction",
                "description": "Refraction Test",
                "required_fields": ["sphere", "cylinder", "axis"],
                "optional_fields": ["add_power", "notes"],
                "result_format": {
                    "sphere": "+2.50",
                    "cylinder": "-1.00",
                    "axis": "90",
                    "add_power": "+1.50",
                    "status": "normal|abnormal"
                }
            },
            "tonometry": {
                "test_type": "tonometry",
                "description": "Tonometry Test",
                "required_fields": ["intraocular_pressure"],
                "optional_fields": ["test_method", "notes"],
                "result_format": {
                    "intraocular_pressure": "16",
                    "test_method": "applanation|non_contact",
                    "status": "normal|abnormal"
                }
            }
        }
        
        return templates
    
    async def analyze_vision_test_results(self, test_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze vision test results and provide insights"""
        if not test_results:
            return {
                "analysis": "No test results available",
                "recommendations": [],
                "risk_factors": [],
                "overall_status": "unknown"
            }
        
        # Analyze results
        abnormal_tests = []
        risk_factors = []
        recommendations = []
        
        for test in test_results:
            test_type = test.get("test_type")
            results = test.get("results", {})
            status = results.get("status", "unknown")
            
            if status == "abnormal":
                abnormal_tests.append(test_type)
                
                # Add specific risk factors based on test type
                if test_type == "visual_acuity":
                    acuity_value = results.get("acuity_value", "")
                    if acuity_value and "20/40" in acuity_value:
                        risk_factors.append("Reduced visual acuity")
                        recommendations.append("Consider corrective lenses")
                
                elif test_type == "color_vision":
                    color_result = results.get("color_vision_result", "")
                    if color_result == "deficient":
                        risk_factors.append("Color vision deficiency")
                        recommendations.append("Consider occupational implications")
                
                elif test_type == "depth_perception":
                    depth_result = results.get("depth_perception_result", "")
                    if depth_result == "reduced":
                        risk_factors.append("Reduced depth perception")
                        recommendations.append("Consider driving restrictions")
                
                elif test_type == "tonometry":
                    iop = results.get("intraocular_pressure", 0)
                    if iop > 21:
                        risk_factors.append("Elevated intraocular pressure")
                        recommendations.append("Consider glaucoma evaluation")
        
        # Determine overall status
        if len(abnormal_tests) == 0:
            overall_status = "normal"
        elif len(abnormal_tests) <= 2:
            overall_status = "mild_abnormal"
        else:
            overall_status = "significant_abnormal"
        
        return {
            "analysis": f"Found {len(abnormal_tests)} abnormal test(s)",
            "abnormal_tests": abnormal_tests,
            "risk_factors": risk_factors,
            "recommendations": recommendations,
            "overall_status": overall_status,
            "total_tests": len(test_results)
        }
    
    async def export_vision_test_data(self, screening_id: str, format: str = "json") -> Dict[str, Any]:
        """Export vision test data for a screening"""
        vision_tests = await self.get_vision_tests_by_screening(screening_id)
        
        if format.lower() == "json":
            return {
                "screening_id": screening_id,
                "format": "json",
                "total_tests": len(vision_tests),
                "data": vision_tests,
                "exported_at": datetime.utcnow().isoformat()
            }
        elif format.lower() == "csv":
            # In a real implementation, this would generate CSV data
            return {
                "screening_id": screening_id,
                "format": "csv",
                "total_tests": len(vision_tests),
                "data": "CSV data would be generated here",
                "exported_at": datetime.utcnow().isoformat()
            }
        else:
            raise ValueError(f"Unsupported format: {format}")
    
    async def get_vision_test_history(self, patient_id: str) -> List[Dict[str, Any]]:
        """Get vision test history for a patient across all screenings"""
        # This would typically query across multiple screenings
        # For now, return tests from all screenings
        all_tests = []
        
        for test in self.vision_tests.values():
            # In a real implementation, we'd join with screening data to get patient_id
            # For now, we'll return all tests
            all_tests.append(test)
        
        # Sort by test date
        all_tests.sort(key=lambda x: x.get("test_date", ""), reverse=True)
        
        return all_tests

