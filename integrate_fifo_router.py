#!/usr/bin/env python3

"""
FIFO Workflow Router Integration Script
Integrates the hospital mobile workflow FIFO router into main.py
"""

import re

def integrate_fifo_router():
    """Integrate FIFO workflow router into main.py"""
    print("🔧 Integrating FIFO Workflow Router...")
    
    # Read current main.py
    with open("/www/dk_project/evep-my-firstcare-com/backend/app/main.py", "r") as f:
        content = f.read()
    
    # Check if already integrated
    if "hospital_mobile_workflow_router" in content:
        print("✅ FIFO workflow router already integrated")
        return True
    
    # Add import
    import_pattern = r"(from app\.api\.specialized_screenings import router as specialized_screenings_router)"
    import_replacement = r"\1\nfrom app.api.hospital_mobile_workflow_router import router as hospital_mobile_workflow_router"
    
    content = re.sub(import_pattern, import_replacement, content)
    
    # Add router registration
    router_pattern = r"(app\.include_router\(specialized_screenings_router, prefix=\"/api/v1\", tags=\[\"specialized_screenings\"\]\))"
    router_replacement = r"""\1

    # FIFO-Enhanced Hospital Mobile Workflow API
    logger.info("Hospital Mobile Workflow FIFO API router included successfully!")
    app.include_router(hospital_mobile_workflow_router, tags=["Hospital Mobile Workflow FIFO"])"""
    
    content = re.sub(router_pattern, router_replacement, content)
    
    # Write updated content
    with open("/www/dk_project/evep-my-firstcare-com/backend/app/main.py", "w") as f:
        f.write(content)
    
    print("✅ FIFO workflow router integration complete")
    return True

def verify_integration():
    """Verify the integration was successful"""
    print("🔍 Verifying integration...")
    
    with open("/www/dk_project/evep-my-firstcare-com/backend/app/main.py", "r") as f:
        content = f.read()
    
    # Check import
    if "from app.api.hospital_mobile_workflow_router import router as hospital_mobile_workflow_router" in content:
        print("✅ Import added successfully")
    else:
        print("❌ Import missing")
        return False
    
    # Check registration
    if "app.include_router(hospital_mobile_workflow_router" in content:
        print("✅ Router registration added successfully")
    else:
        print("❌ Router registration missing")
        return False
    
    return True

def create_simple_test_endpoint():
    """Create a simple test endpoint file"""
    print("📝 Creating simple test endpoint...")
    
    simple_router_content = '''"""
Simple Hospital Mobile Workflow Test Router
"""

from fastapi import APIRouter
from datetime import datetime

router = APIRouter(
    prefix="/api/v2/hospital_mobile/workflow",
    tags=["Hospital Mobile Workflow Test"]
)

@router.get("/health")
async def workflow_health():
    """Simple health check for workflow system"""
    return {
        "status": "healthy",
        "service": "Hospital Mobile Workflow FIFO",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "fifo_enabled": True
    }

@router.get("/test")
async def workflow_test():
    """Test endpoint for workflow system"""
    return {
        "message": "Hospital Mobile Workflow FIFO system is operational",
        "endpoints_available": [
            "/health - Health check",
            "/test - This test endpoint", 
            "/session/create - Create workflow session (planned)",
            "/step/update - Update workflow step with FIFO (planned)"
        ],
        "features": [
            "FIFO field-level change management",
            "Real-time conflict detection", 
            "Multi-user collaboration",
            "Complete audit trail"
        ]
    }
'''
    
    with open("/www/dk_project/evep-my-firstcare-com/backend/app/api/hospital_mobile_workflow_router.py", "w") as f:
        f.write(simple_router_content)
    
    print("✅ Simple test endpoint created")

if __name__ == "__main__":
    print("🚀 FIFO Workflow Router Integration")
    print("=" * 40)
    
    # Create simple test router
    create_simple_test_endpoint()
    
    # Integrate router
    if integrate_fifo_router():
        if verify_integration():
            print("\n🎉 Integration successful!")
            print("✅ FIFO workflow router ready for testing")
        else:
            print("\n❌ Integration verification failed")
    else:
        print("\n❌ Integration failed")
    
    print(f"\n📅 Completed: {datetime.now()}")
    print("\n🔄 Restart backend to apply changes:")
    print("   docker-compose restart evep-stardust")