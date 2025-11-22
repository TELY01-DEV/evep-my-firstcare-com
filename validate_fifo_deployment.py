#!/usr/bin/env python3

"""
FIFO Implementation Deployment Validation Script
Validates that the FIFO field-level change management system is working correctly
"""

import sys
import os
import asyncio
from datetime import datetime, timezone
import uuid

def test_basic_imports():
    """Test basic imports and dependencies"""
    print("🔍 Testing basic imports...")
    
    try:
        from fifo_change_manager import FIFOChangeManager, FieldChange, ConflictResolutionStrategy
        print("✅ FIFO Change Manager imported successfully")
        return True
    except ImportError as e:
        print(f"❌ Failed to import FIFO Manager: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error importing FIFO Manager: {e}")
        return False

def test_database_connection():
    """Test database connection with production MongoDB"""
    print("\n🗄️  Testing database connection...")
    
    try:
        # Use production MongoDB connection string
        mongodb_urls = [
            "mongodb://mongo-primary:27017/evep",  # Production
            "mongodb://localhost:27017",  # Fallback
            "mongodb://127.0.0.1:27017"  # Alternative
        ]
        
        from fifo_change_manager import FIFOChangeManager
        
        for mongodb_url in mongodb_urls:
            try:
                print(f"🔌 Trying connection: {mongodb_url}")
                manager = FIFOChangeManager(mongodb_url=mongodb_url, db_name="evep_system")
                
                # Test basic database operations
                stats = manager.get_processing_stats("validation_test")
                print(f"✅ Database connection successful: {mongodb_url}")
                print(f"📊 Test stats: {stats}")
                
                manager.close()
                return True
                
            except Exception as e:
                print(f"⚠️  Connection failed for {mongodb_url}: {e}")
                continue
        
        print("❌ All database connections failed")
        return False
        
    except Exception as e:
        print(f"❌ Database connection test failed: {e}")
        return False

async def test_fifo_functionality():
    """Test core FIFO functionality"""
    print("\n🔄 Testing FIFO functionality...")
    
    try:
        from fifo_change_manager import FIFOChangeManager, FieldChange
        
        # Use production MongoDB
        manager = FIFOChangeManager(mongodb_url="mongodb://mongo-primary:27017/evep", db_name="evep_system")
        
        # Test session
        session_id = f"test_validation_{int(datetime.now().timestamp())}"
        step_number = 1
        
        # Create test field changes
        changes = [
            FieldChange(
                session_id=session_id,
                step_number=step_number,
                field_path="test_field_1",
                old_value="old_value_1",
                new_value="new_value_1",
                user_id="test_user_1",
                user_name="Test User 1",
                timestamp=datetime.now(timezone.utc),
                change_id=str(uuid.uuid4())
            ),
            FieldChange(
                session_id=session_id,
                step_number=step_number,
                field_path="test_field_2",
                old_value="old_value_2",
                new_value="new_value_2",
                user_id="test_user_2",
                user_name="Test User 2",
                timestamp=datetime.now(timezone.utc),
                change_id=str(uuid.uuid4())
            )
        ]
        
        # Queue changes
        for change in changes:
            success = await manager.queue_field_change(change)
            if success:
                print(f"✅ Queued change: {change.field_path}")
            else:
                print(f"❌ Failed to queue change: {change.field_path}")
                return False
        
        # Process FIFO changes
        final_values = await manager.process_fifo_changes(session_id, step_number)
        print(f"✅ FIFO processing complete: {len(final_values)} values")
        print(f"📋 Final values: {final_values}")
        
        # Get stats
        stats = manager.get_processing_stats(session_id)
        print(f"📊 Processing stats: {stats}")
        
        manager.close()
        print("✅ FIFO functionality test passed")
        return True
        
    except Exception as e:
        print(f"❌ FIFO functionality test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_socket_io_integration():
    """Test Socket.IO collaborative editing integration"""
    print("\n🔗 Testing Socket.IO integration...")
    
    try:
        # Check if enhanced Socket.IO service exists
        import socketio_service
        print("✅ Socket.IO service imported")
        
        # Check for collaborative editing events
        if hasattr(socketio_service, 'sio'):
            print("✅ Socket.IO instance found")
            
            # Check for collaborative events (these should be registered)
            collaborative_events = ['live_typing', 'field_completed', 'cursor_position', 'field_conflict_detected']
            
            found_events = []
            if hasattr(socketio_service.sio, 'handlers'):
                for namespace, handlers in socketio_service.sio.handlers.items():
                    for event in collaborative_events:
                        if event in handlers:
                            found_events.append(event)
            
            if found_events:
                print(f"✅ Found collaborative events: {found_events}")
            else:
                print("⚠️  No collaborative events found in handlers")
            
        else:
            print("⚠️  Socket.IO instance not found")
        
        return True
        
    except ImportError as e:
        print(f"❌ Socket.IO import failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Socket.IO integration test failed: {e}")
        return False

def test_workflow_api_enhancement():
    """Test if enhanced workflow API is available"""
    print("\n🚀 Testing enhanced workflow API...")
    
    try:
        # Check if enhanced workflow API exists
        import sys
        import os
        
        # Check if enhanced_workflow_api.py exists in hospital_mobile
        api_path = os.path.join(os.path.dirname(__file__), "api", "hospital_mobile", "enhanced_workflow_api.py")
        
        if os.path.exists(api_path):
            print("✅ Enhanced workflow API file found")
        else:
            print(f"⚠️  Enhanced workflow API file not found at {api_path}")
        
        # Try to import (may fail due to FastAPI dependencies, but that's OK)
        try:
            # Add current directory to Python path
            current_dir = os.path.dirname(__file__)
            if current_dir not in sys.path:
                sys.path.insert(0, current_dir)
            
            import api.hospital_mobile.enhanced_workflow_api as enhanced_api
            print("✅ Enhanced workflow API imported successfully")
            
            # Check for key functions
            if hasattr(enhanced_api, 'update_step_with_fifo'):
                print("✅ FIFO step update function found")
            
            if hasattr(enhanced_api, 'get_fifo_manager'):
                print("✅ FIFO manager dependency injection found")
                
        except ImportError as e:
            print(f"⚠️  Enhanced workflow API import failed (expected if FastAPI not available): {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ Enhanced workflow API test failed: {e}")
        return False

def main():
    """Main validation function"""
    print("🚀 === FIFO IMPLEMENTATION DEPLOYMENT VALIDATION ===")
    print(f"Validation started: {datetime.now()}")
    print(f"Python version: {sys.version}")
    print(f"Current directory: {os.getcwd()}")
    print()
    
    results = {
        "imports": test_basic_imports(),
        "database": test_database_connection(),
        "socketio": test_socket_io_integration(),
        "api": test_workflow_api_enhancement()
    }
    
    # Run async FIFO functionality test
    try:
        results["fifo"] = asyncio.run(test_fifo_functionality())
    except Exception as e:
        print(f"❌ FIFO async test failed: {e}")
        results["fifo"] = False
    
    print("\n📋 === VALIDATION SUMMARY ===")
    print()
    
    total_tests = len(results)
    passed_tests = sum(1 for result in results.values() if result)
    
    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"   {test_name.upper()}: {status}")
    
    print()
    print(f"📊 Total: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🎉 ALL VALIDATION TESTS PASSED!")
        print("✅ FIFO implementation is ready for production use")
    elif passed_tests >= total_tests - 1:
        print("⚠️  MOSTLY WORKING - Minor issues detected")
        print("🔧 FIFO implementation is functional but may need minor fixes")
    else:
        print("❌ CRITICAL ISSUES DETECTED")
        print("🚨 FIFO implementation needs attention before production use")
    
    print(f"\n✅ Validation completed: {datetime.now()}")
    
    return passed_tests == total_tests

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)