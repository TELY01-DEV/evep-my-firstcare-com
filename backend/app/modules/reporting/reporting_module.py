from abc import ABC
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from app.core.base_module import BaseModule
from app.core.config import Config
from app.core.event_bus import event_bus
from app.modules.reporting.services.analytics_service import AnalyticsService
from app.modules.reporting.services.report_service import ReportService
from app.modules.reporting.services.dashboard_service import DashboardService

class ReportingModule(BaseModule):
    """Reporting module for EVEP Platform"""
    
    def __init__(self):
        super().__init__()
        self.name = "reporting"
        self.version = "1.0.0"
        self.description = "Analytics, reporting, and data visualization"
        
        # Initialize services
        self.analytics_service = AnalyticsService()
        self.report_service = ReportService()
        self.dashboard_service = DashboardService()
        
        # Setup router
        self.router = APIRouter(prefix="/api/v1/reports", tags=["reports"])
        self._setup_routes()
    
    async def initialize(self) -> None:
        """Initialize the reporting module"""
        print(f"🔧 Initializing {self.name} module v{self.version}")
        
        # Initialize services
        await self.analytics_service.initialize()
        await self.report_service.initialize()
        await self.dashboard_service.initialize()
        
        # Subscribe to events
        event_bus.subscribe("report.generated", self._handle_report_generated)
        event_bus.subscribe("dashboard.updated", self._handle_dashboard_updated)
        event_bus.subscribe("analytics.updated", self._handle_analytics_updated)
        
        print(f"✅ {self.name} module initialized successfully")
    
    def get_router(self) -> APIRouter:
        """Get the reporting module router"""
        return self.router
    
    def get_events(self) -> List[str]:
        """Get events that this module subscribes to"""
        return [
            "report.generated",
            "dashboard.updated",
            "analytics.updated"
        ]
    
    def _setup_routes(self) -> None:
        """Setup reporting API routes"""
        
        @self.router.get("/analytics/overview")
        async def get_analytics_overview():
            """Get comprehensive analytics overview"""
            try:
                analytics = await self.analytics_service.get_overview_analytics()
                return {
                    "status": "success",
                    "data": analytics,
                    "message": "Analytics overview retrieved successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/analytics/patients")
        async def get_patient_analytics(
            time_range: Optional[str] = Query("30d", description="Time range for analytics"),
            group_by: Optional[str] = Query("month", description="Grouping criteria")
        ):
            """Get patient analytics"""
            try:
                analytics = await self.analytics_service.get_patient_analytics(
                    time_range=time_range,
                    group_by=group_by
                )
                return {
                    "status": "success",
                    "data": analytics,
                    "message": "Patient analytics retrieved successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/analytics/screenings")
        async def get_screening_analytics(
            time_range: Optional[str] = Query("30d", description="Time range for analytics"),
            screening_type: Optional[str] = Query(None, description="Filter by screening type"),
            group_by: Optional[str] = Query("month", description="Grouping criteria")
        ):
            """Get screening analytics"""
            try:
                analytics = await self.analytics_service.get_screening_analytics(
                    time_range=time_range,
                    screening_type=screening_type,
                    group_by=group_by
                )
                return {
                    "status": "success",
                    "data": analytics,
                    "message": "Screening analytics retrieved successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/analytics/vision-tests")
        async def get_vision_test_analytics(
            time_range: Optional[str] = Query("30d", description="Time range for analytics"),
            test_type: Optional[str] = Query(None, description="Filter by test type"),
            group_by: Optional[str] = Query("month", description="Grouping criteria")
        ):
            """Get vision test analytics"""
            try:
                analytics = await self.analytics_service.get_vision_test_analytics(
                    time_range=time_range,
                    test_type=test_type,
                    group_by=group_by
                )
                return {
                    "status": "success",
                    "data": analytics,
                    "message": "Vision test analytics retrieved successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/analytics/assessments")
        async def get_assessment_analytics(
            time_range: Optional[str] = Query("30d", description="Time range for analytics"),
            assessment_type: Optional[str] = Query(None, description="Filter by assessment type"),
            severity: Optional[str] = Query(None, description="Filter by severity"),
            group_by: Optional[str] = Query("month", description="Grouping criteria")
        ):
            """Get assessment analytics"""
            try:
                analytics = await self.analytics_service.get_assessment_analytics(
                    time_range=time_range,
                    assessment_type=assessment_type,
                    severity=severity,
                    group_by=group_by
                )
                return {
                    "status": "success",
                    "data": analytics,
                    "message": "Assessment analytics retrieved successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/analytics/trends")
        async def get_trend_analytics(
            metric: str = Query(..., description="Metric to analyze"),
            time_range: Optional[str] = Query("90d", description="Time range for trend analysis"),
            interval: Optional[str] = Query("week", description="Time interval for data points")
        ):
            """Get trend analytics for specific metrics"""
            try:
                trends = await self.analytics_service.get_trend_analytics(
                    metric=metric,
                    time_range=time_range,
                    interval=interval
                )
                return {
                    "status": "success",
                    "data": trends,
                    "message": "Trend analytics retrieved successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/reports/")
        async def get_reports(
            skip: int = Query(0, ge=0, description="Number of records to skip"),
            limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
            report_type: Optional[str] = Query(None, description="Filter by report type"),
            status: Optional[str] = Query(None, description="Filter by report status")
        ):
            """Get all reports with optional filtering"""
            try:
                reports = await self.report_service.get_reports(
                    skip=skip,
                    limit=limit,
                    report_type=report_type,
                    status=status
                )
                return {
                    "status": "success",
                    "data": reports,
                    "message": "Reports retrieved successfully",
                    "pagination": {
                        "skip": skip,
                        "limit": limit,
                        "total": len(reports)
                    }
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/reports/{report_id}")
        async def get_report(report_id: str):
            """Get a specific report by ID"""
            try:
                report = await self.report_service.get_report(report_id)
                if not report:
                    raise HTTPException(status_code=404, detail="Report not found")
                
                return {
                    "status": "success",
                    "data": report,
                    "message": "Report retrieved successfully"
                }
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.post("/reports/")
        async def create_report(report_data: Dict[str, Any]):
            """Create a new report"""
            try:
                report = await self.report_service.create_report(report_data)
                return {
                    "status": "success",
                    "data": report,
                    "message": "Report created successfully"
                }
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.put("/reports/{report_id}")
        async def update_report(report_id: str, updates: Dict[str, Any]):
            """Update a report"""
            try:
                report = await self.report_service.update_report(report_id, updates)
                if not report:
                    raise HTTPException(status_code=404, detail="Report not found")
                
                return {
                    "status": "success",
                    "data": report,
                    "message": "Report updated successfully"
                }
            except HTTPException:
                raise
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.delete("/reports/{report_id}")
        async def delete_report(report_id: str):
            """Delete a report"""
            try:
                success = await self.report_service.delete_report(report_id)
                if not success:
                    raise HTTPException(status_code=404, detail="Report not found")
                
                return {
                    "status": "success",
                    "message": "Report deleted successfully"
                }
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.post("/reports/{report_id}/generate")
        async def generate_report(report_id: str):
            """Generate a report"""
            try:
                report = await self.report_service.generate_report(report_id)
                if not report:
                    raise HTTPException(status_code=404, detail="Report not found")
                
                return {
                    "status": "success",
                    "data": report,
                    "message": "Report generated successfully"
                }
            except HTTPException:
                raise
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/reports/{report_id}/download")
        async def download_report(
            report_id: str,
            format: str = Query("pdf", description="Download format (pdf, excel, csv)")
        ):
            """Download a report in specified format"""
            try:
                download_data = await self.report_service.download_report(report_id, format)
                if not download_data:
                    raise HTTPException(status_code=404, detail="Report not found")
                
                return {
                    "status": "success",
                    "data": download_data,
                    "message": "Report download prepared successfully"
                }
            except HTTPException:
                raise
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/reports/templates")
        async def get_report_templates():
            """Get available report templates"""
            try:
                templates = await self.report_service.get_report_templates()
                return {
                    "status": "success",
                    "data": templates,
                    "message": "Report templates retrieved successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/dashboard/overview")
        async def get_dashboard_overview():
            """Get dashboard overview data"""
            try:
                dashboard_data = await self.dashboard_service.get_overview_data()
                return {
                    "status": "success",
                    "data": dashboard_data,
                    "message": "Dashboard overview retrieved successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/dashboard/patient-summary")
        async def get_patient_dashboard():
            """Get patient dashboard data"""
            try:
                dashboard_data = await self.dashboard_service.get_patient_dashboard()
                return {
                    "status": "success",
                    "data": dashboard_data,
                    "message": "Patient dashboard retrieved successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/dashboard/screening-summary")
        async def get_screening_dashboard():
            """Get screening dashboard data"""
            try:
                dashboard_data = await self.dashboard_service.get_screening_dashboard()
                return {
                    "status": "success",
                    "data": dashboard_data,
                    "message": "Screening dashboard retrieved successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/dashboard/performance")
        async def get_performance_dashboard():
            """Get performance dashboard data"""
            try:
                dashboard_data = await self.dashboard_service.get_performance_dashboard()
                return {
                    "status": "success",
                    "data": dashboard_data,
                    "message": "Performance dashboard retrieved successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/dashboard/alerts")
        async def get_dashboard_alerts():
            """Get dashboard alerts and notifications"""
            try:
                alerts = await self.dashboard_service.get_alerts()
                return {
                    "status": "success",
                    "data": alerts,
                    "message": "Dashboard alerts retrieved successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/export/patients")
        async def export_patient_data(
            format: str = Query("csv", description="Export format (csv, excel, json)"),
            filters: Optional[str] = Query(None, description="Export filters as JSON string")
        ):
            """Export patient data"""
            try:
                export_data = await self.analytics_service.export_patient_data(
                    format=format,
                    filters=filters
                )
                return {
                    "status": "success",
                    "data": export_data,
                    "message": "Patient data exported successfully"
                }
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/export/screenings")
        async def export_screening_data(
            format: str = Query("csv", description="Export format (csv, excel, json)"),
            filters: Optional[str] = Query(None, description="Export filters as JSON string")
        ):
            """Export screening data"""
            try:
                export_data = await self.analytics_service.export_screening_data(
                    format=format,
                    filters=filters
                )
                return {
                    "status": "success",
                    "data": export_data,
                    "message": "Screening data exported successfully"
                }
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/export/analytics")
        async def export_analytics_data(
            format: str = Query("csv", description="Export format (csv, excel, json)"),
            analytics_type: str = Query(..., description="Type of analytics to export"),
            time_range: Optional[str] = Query("30d", description="Time range for analytics")
        ):
            """Export analytics data"""
            try:
                export_data = await self.analytics_service.export_analytics_data(
                    format=format,
                    analytics_type=analytics_type,
                    time_range=time_range
                )
                return {
                    "status": "success",
                    "data": export_data,
                    "message": "Analytics data exported successfully"
                }
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/metrics/real-time")
        async def get_real_time_metrics():
            """Get real-time system metrics"""
            try:
                metrics = await self.analytics_service.get_real_time_metrics()
                return {
                    "status": "success",
                    "data": metrics,
                    "message": "Real-time metrics retrieved successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/metrics/performance")
        async def get_performance_metrics(
            time_range: Optional[str] = Query("24h", description="Time range for metrics")
        ):
            """Get system performance metrics"""
            try:
                metrics = await self.analytics_service.get_performance_metrics(
                    time_range=time_range
                )
                return {
                    "status": "success",
                    "data": metrics,
                    "message": "Performance metrics retrieved successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
    
    async def _handle_report_generated(self, data: Dict[str, Any]) -> None:
        """Handle report generated event"""
        try:
            report_id = data.get("report_id")
            report_type = data.get("report_type")
            
            # Emit additional events
            await event_bus.emit("notification.send", {
                "type": "report_generated",
                "report_id": report_id,
                "report_type": report_type,
                "user_id": data.get("user_id")
            })
            
            await event_bus.emit("audit.log", {
                "action": "report_generated",
                "resource": "report",
                "resource_id": report_id,
                "user_id": data.get("user_id"),
                "details": {"report_type": report_type}
            })
            
        except Exception as e:
            print(f"Error handling report generated event: {e}")
    
    async def _handle_dashboard_updated(self, data: Dict[str, Any]) -> None:
        """Handle dashboard updated event"""
        try:
            dashboard_id = data.get("dashboard_id")
            update_type = data.get("update_type")
            
            await event_bus.emit("audit.log", {
                "action": "dashboard_updated",
                "resource": "dashboard",
                "resource_id": dashboard_id,
                "user_id": data.get("user_id"),
                "details": {"update_type": update_type}
            })
            
        except Exception as e:
            print(f"Error handling dashboard updated event: {e}")
    
    async def _handle_analytics_updated(self, data: Dict[str, Any]) -> None:
        """Handle analytics updated event"""
        try:
            analytics_type = data.get("analytics_type")
            update_source = data.get("update_source")
            
            await event_bus.emit("audit.log", {
                "action": "analytics_updated",
                "resource": "analytics",
                "user_id": data.get("user_id"),
                "details": {
                    "analytics_type": analytics_type,
                    "update_source": update_source
                }
            })
            
        except Exception as e:
            print(f"Error handling analytics updated event: {e}")

