from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from app.core.config import Config

class ReportService:
    """Report service for EVEP Platform"""
    
    def __init__(self):
        self.config = Config.get_module_config("reporting")
        
        # In-memory storage for demonstration
        self.reports = {}
        self.report_counter = 0
    
    async def initialize(self) -> None:
        """Initialize the report service"""
        print("🔧 Report service initialized")
    
    async def get_reports(
        self,
        skip: int = 0,
        limit: int = 100,
        report_type: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get reports with optional filtering"""
        reports = list(self.reports.values())
        
        # Apply filters
        if report_type:
            reports = [r for r in reports if r["report_type"] == report_type]
        
        if status:
            reports = [r for r in reports if r["status"] == status]
        
        # Apply pagination
        return reports[skip:skip + limit]
    
    async def get_report(self, report_id: str) -> Optional[Dict[str, Any]]:
        """Get a report by ID"""
        return self.reports.get(report_id)
    
    async def create_report(self, report_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new report"""
        # Validate required fields
        required_fields = ["report_type", "title", "description"]
        for field in required_fields:
            if field not in report_data:
                raise ValueError(f"Missing required field: {field}")
        
        # Generate report ID
        self.report_counter += 1
        report_id = f"RPT-{self.report_counter:06d}"
        
        # Create report
        report = {
            "report_id": report_id,
            "report_type": report_data["report_type"],
            "title": report_data["title"],
            "description": report_data["description"],
            "parameters": report_data.get("parameters", {}),
            "status": "draft",
            "created_by": report_data.get("created_by", "system"),
            "created_at": datetime.utcnow().isoformat(),
            "generated_at": None,
            "file_path": None,
            "file_size": None,
            "download_url": None
        }
        
        # Store report
        self.reports[report_id] = report
        
        return report
    
    async def update_report(self, report_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a report"""
        if report_id not in self.reports:
            return None
        
        report = self.reports[report_id]
        
        # Update fields
        for key, value in updates.items():
            if key in report:
                report[key] = value
        
        report["updated_at"] = datetime.utcnow().isoformat()
        
        return report
    
    async def delete_report(self, report_id: str) -> bool:
        """Delete a report"""
        if report_id not in self.reports:
            return False
        
        del self.reports[report_id]
        return True
    
    async def generate_report(self, report_id: str) -> Optional[Dict[str, Any]]:
        """Generate a report"""
        if report_id not in self.reports:
            return None
        
        report = self.reports[report_id]
        
        # Update report status
        report["status"] = "generating"
        report["updated_at"] = datetime.utcnow().isoformat()
        
        # Simulate report generation
        # In a real implementation, this would generate the actual report
        await self._simulate_report_generation(report)
        
        # Update report with generation results
        report["status"] = "completed"
        report["generated_at"] = datetime.utcnow().isoformat()
        report["file_path"] = f"/reports/{report_id}.pdf"
        report["file_size"] = "2.5MB"
        report["download_url"] = f"/api/v1/reports/{report_id}/download"
        
        return report
    
    async def _simulate_report_generation(self, report: Dict[str, Any]) -> None:
        """Simulate report generation process"""
        # In a real implementation, this would:
        # 1. Query data based on report parameters
        # 2. Process and format the data
        # 3. Generate the report file (PDF, Excel, etc.)
        # 4. Store the file and update metadata
        
        import asyncio
        await asyncio.sleep(1)  # Simulate processing time
    
    async def download_report(self, report_id: str, format: str = "pdf") -> Optional[Dict[str, Any]]:
        """Download a report in specified format"""
        if report_id not in self.reports:
            return None
        
        report = self.reports[report_id]
        
        if report["status"] != "completed":
            raise ValueError("Report is not ready for download")
        
        # In a real implementation, this would:
        # 1. Check if the requested format is available
        # 2. Generate the file in the requested format if needed
        # 3. Return download information
        
        download_data = {
            "report_id": report_id,
            "report_title": report["title"],
            "format": format,
            "file_path": report["file_path"],
            "file_size": report["file_size"],
            "download_url": report["download_url"],
            "expires_at": (datetime.utcnow() + timedelta(hours=24)).isoformat()
        }
        
        return download_data
    
    async def get_report_templates(self) -> Dict[str, Any]:
        """Get available report templates"""
        templates = {
            "patient_summary": {
                "name": "Patient Summary Report",
                "description": "Comprehensive patient demographics and statistics",
                "parameters": {
                    "time_range": "30d",
                    "age_groups": ["0-5", "6-12", "13-18", "19-25", "26+"],
                    "locations": ["all"],
                    "include_demographics": True,
                    "include_statistics": True
                },
                "output_formats": ["pdf", "excel", "csv"],
                "estimated_generation_time": "30 seconds"
            },
            "screening_report": {
                "name": "Screening Activity Report",
                "description": "Screening activities and results summary",
                "parameters": {
                    "time_range": "30d",
                    "screening_types": ["all"],
                    "include_results": True,
                    "include_trends": True,
                    "group_by": "week"
                },
                "output_formats": ["pdf", "excel", "csv"],
                "estimated_generation_time": "45 seconds"
            },
            "vision_test_report": {
                "name": "Vision Test Results Report",
                "description": "Detailed vision test results and analysis",
                "parameters": {
                    "time_range": "30d",
                    "test_types": ["all"],
                    "include_analysis": True,
                    "include_recommendations": True,
                    "group_by": "test_type"
                },
                "output_formats": ["pdf", "excel", "csv"],
                "estimated_generation_time": "60 seconds"
            },
            "assessment_report": {
                "name": "Assessment Summary Report",
                "description": "Assessment activities and outcomes",
                "parameters": {
                    "time_range": "30d",
                    "assessment_types": ["all"],
                    "include_severity": True,
                    "include_urgency": True,
                    "group_by": "assessment_type"
                },
                "output_formats": ["pdf", "excel", "csv"],
                "estimated_generation_time": "40 seconds"
            },
            "performance_report": {
                "name": "System Performance Report",
                "description": "System performance and usage metrics",
                "parameters": {
                    "time_range": "24h",
                    "include_metrics": True,
                    "include_alerts": True,
                    "include_recommendations": True
                },
                "output_formats": ["pdf", "excel", "json"],
                "estimated_generation_time": "20 seconds"
            },
            "comprehensive_report": {
                "name": "Comprehensive Platform Report",
                "description": "Complete platform overview and analytics",
                "parameters": {
                    "time_range": "90d",
                    "include_all_sections": True,
                    "include_trends": True,
                    "include_insights": True,
                    "include_recommendations": True
                },
                "output_formats": ["pdf", "excel"],
                "estimated_generation_time": "120 seconds"
            }
        }
        
        return templates
    
    async def get_reports_by_type(self, report_type: str) -> List[Dict[str, Any]]:
        """Get reports by type"""
        return [
            report for report in self.reports.values()
            if report["report_type"] == report_type
        ]
    
    async def get_reports_by_status(self, status: str) -> List[Dict[str, Any]]:
        """Get reports by status"""
        return [
            report for report in self.reports.values()
            if report["status"] == status
        ]
    
    async def get_reports_by_creator(self, created_by: str) -> List[Dict[str, Any]]:
        """Get reports by creator"""
        return [
            report for report in self.reports.values()
            if report["created_by"] == created_by
        ]
    
    async def get_report_statistics(self) -> Dict[str, Any]:
        """Get report statistics"""
        total_reports = len(self.reports)
        
        # Status distribution
        status_counts = {}
        for report in self.reports.values():
            status = report["status"]
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Type distribution
        type_counts = {}
        for report in self.reports.values():
            report_type = report["report_type"]
            type_counts[report_type] = type_counts.get(report_type, 0) + 1
        
        # Creator distribution
        creator_counts = {}
        for report in self.reports.values():
            creator = report["created_by"]
            creator_counts[creator] = creator_counts.get(creator, 0) + 1
        
        return {
            "total_reports": total_reports,
            "status_distribution": status_counts,
            "type_distribution": type_counts,
            "creator_distribution": creator_counts,
            "last_updated": datetime.utcnow().isoformat()
        }
    
    async def validate_report_data(self, report_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate report data"""
        validation_result = {
            "is_valid": True,
            "errors": [],
            "warnings": []
        }
        
        # Check required fields
        required_fields = ["report_type", "title", "description"]
        for field in required_fields:
            if field not in report_data:
                validation_result["is_valid"] = False
                validation_result["errors"].append(f"Missing required field: {field}")
        
        # Validate report type
        if "report_type" in report_data:
            valid_types = [
                "patient_summary",
                "screening_report",
                "vision_test_report",
                "assessment_report",
                "performance_report",
                "comprehensive_report"
            ]
            if report_data["report_type"] not in valid_types:
                validation_result["warnings"].append(f"Report type '{report_data['report_type']}' is not in standard list")
        
        # Validate title
        if "title" in report_data:
            title = report_data["title"]
            if not isinstance(title, str) or len(title.strip()) == 0:
                validation_result["is_valid"] = False
                validation_result["errors"].append("Title must be a non-empty string")
            elif len(title) > 200:
                validation_result["warnings"].append("Title is very long")
        
        # Validate description
        if "description" in report_data:
            description = report_data["description"]
            if not isinstance(description, str) or len(description.strip()) == 0:
                validation_result["is_valid"] = False
                validation_result["errors"].append("Description must be a non-empty string")
        
        return validation_result
    
    async def schedule_report(self, report_data: Dict[str, Any], schedule: Dict[str, Any]) -> Dict[str, Any]:
        """Schedule a report for automatic generation"""
        # Create the report first
        report = await self.create_report(report_data)
        
        # Add scheduling information
        report["scheduled"] = True
        report["schedule"] = schedule
        report["next_generation"] = schedule.get("next_run")
        
        return report
    
    async def get_scheduled_reports(self) -> List[Dict[str, Any]]:
        """Get all scheduled reports"""
        return [
            report for report in self.reports.values()
            if report.get("scheduled", False)
        ]
    
    async def cancel_scheduled_report(self, report_id: str) -> bool:
        """Cancel a scheduled report"""
        if report_id not in self.reports:
            return False
        
        report = self.reports[report_id]
        if report.get("scheduled", False):
            report["scheduled"] = False
            report["schedule"] = None
            report["next_generation"] = None
            return True
        
        return False
    
    async def get_report_history(self, report_id: str) -> List[Dict[str, Any]]:
        """Get generation history for a report"""
        # In a real implementation, this would track report generation history
        # For now, return basic information
        if report_id not in self.reports:
            return []
        
        report = self.reports[report_id]
        history = [
            {
                "action": "created",
                "timestamp": report["created_at"],
                "user": report["created_by"]
            }
        ]
        
        if report.get("generated_at"):
            history.append({
                "action": "generated",
                "timestamp": report["generated_at"],
                "user": report["created_by"]
            })
        
        if report.get("updated_at"):
            history.append({
                "action": "updated",
                "timestamp": report["updated_at"],
                "user": report["created_by"]
            })
        
        return history
    
    async def duplicate_report(self, report_id: str, new_title: str) -> Optional[Dict[str, Any]]:
        """Duplicate an existing report"""
        if report_id not in self.reports:
            return None
        
        original_report = self.reports[report_id]
        
        # Create new report data
        new_report_data = {
            "report_type": original_report["report_type"],
            "title": new_title,
            "description": f"Copy of {original_report['title']}",
            "parameters": original_report["parameters"],
            "created_by": original_report["created_by"]
        }
        
        # Create the new report
        new_report = await self.create_report(new_report_data)
        
        return new_report

