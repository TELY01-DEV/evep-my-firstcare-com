#!/usr/bin/env python3
"""
Test script for EVEP Platform Modular Configuration
This script tests the core configuration system without requiring FastAPI
"""

import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_config():
    """Test the configuration system"""
    print("🧪 Testing EVEP Platform Modular Configuration")
    print("=" * 50)
    
    try:
        # Test basic configuration
        from app.core.config import Config, MODULE_REGISTRY, FEATURE_FLAGS
        
        print("✅ Configuration imported successfully")
        
        # Test enabled modules
        enabled_modules = Config.get_enabled_modules()
        print(f"📦 Enabled modules: {enabled_modules}")
        
        # Test feature flags
        patient_management_enabled = Config.is_feature_enabled('patient_management')
        screening_enabled = Config.is_feature_enabled('screening')
        ai_analytics_enabled = Config.is_feature_enabled('ai_analytics')
        
        print(f"🔧 Patient Management enabled: {patient_management_enabled}")
        print(f"🔧 Screening enabled: {screening_enabled}")
        print(f"🔧 AI Analytics enabled: {ai_analytics_enabled}")
        
        # Test module configuration
        auth_config = Config.get_module_config('auth')
        print(f"🔐 Auth module config: {auth_config.get('enabled', False)}")
        
        patient_config = Config.get_module_config('patient_management')
        print(f"👥 Patient Management config: {patient_config.get('enabled', False)}")
        
        # Test module dependencies
        patient_deps = Config.get_module_dependencies('patient_management')
        print(f"🔗 Patient Management dependencies: {patient_deps}")
        
        screening_deps = Config.get_module_dependencies('screening')
        print(f"🔗 Screening dependencies: {screening_deps}")
        
        # Test environment
        environment = Config.get_environment()
        print(f"🌍 Environment: {environment}")
        
        # Test database URL
        db_url = Config.get_database_url()
        print(f"🗄️ Database URL: {db_url}")
        
        print("\n✅ All configuration tests passed!")
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Make sure all required modules are available")
        return False
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False
    
    return True

def test_feature_flags():
    """Test the feature flags system"""
    print("\n🧪 Testing Feature Flags System")
    print("=" * 50)
    
    try:
        from app.core.feature_flags import feature_flags
        
        print("✅ Feature flags imported successfully")
        
        # Test feature flag operations
        all_flags = feature_flags.get_all_flags()
        print(f"📋 Total feature flags: {len(all_flags)}")
        
        enabled_features = feature_flags.get_enabled_features()
        print(f"✅ Enabled features: {enabled_features}")
        
        disabled_features = feature_flags.get_disabled_features()
        print(f"❌ Disabled features: {disabled_features}")
        
        # Test individual flags
        print(f"🔧 Patient Management: {feature_flags.is_enabled('patient_management')}")
        print(f"🔧 AI Analytics: {feature_flags.is_enabled('ai_analytics')}")
        print(f"🔧 Telemedicine: {feature_flags.is_enabled('telemedicine')}")
        
        print("\n✅ All feature flag tests passed!")
        
    except Exception as e:
        print(f"❌ Feature flags test failed: {e}")
        return False
    
    return True

def test_module_registry():
    """Test the module registry system"""
    print("\n🧪 Testing Module Registry System")
    print("=" * 50)
    
    try:
        from app.core.module_registry import module_registry
        
        print("✅ Module registry imported successfully")
        
        # Test module registry operations
        enabled_modules = module_registry.get_enabled_modules()
        print(f"📦 Enabled modules: {enabled_modules}")
        
        # Test module info
        for module_name in ['auth', 'patient_management', 'screening']:
            module_info = module_registry.get_module_info(module_name)
            if module_info:
                print(f"📋 {module_name}: {module_info.get('enabled', False)} (v{module_info.get('version', 'N/A')})")
            else:
                print(f"📋 {module_name}: Not found")
        
        # Test dependencies
        for module_name in ['auth', 'patient_management', 'screening']:
            deps = module_registry.get_module_dependencies(module_name)
            print(f"🔗 {module_name} dependencies: {deps}")
        
        print("\n✅ All module registry tests passed!")
        
    except Exception as e:
        print(f"❌ Module registry test failed: {e}")
        return False
    
    return True

def main():
    """Main test function"""
    print("🚀 EVEP Platform Modular Architecture Test")
    print("=" * 60)
    
    # Run tests
    config_test = test_config()
    feature_test = test_feature_flags()
    registry_test = test_module_registry()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Summary:")
    print(f"   Configuration: {'✅ PASS' if config_test else '❌ FAIL'}")
    print(f"   Feature Flags: {'✅ PASS' if feature_test else '❌ FAIL'}")
    print(f"   Module Registry: {'✅ PASS' if registry_test else '❌ FAIL'}")
    
    if all([config_test, feature_test, registry_test]):
        print("\n🎉 All tests passed! Modular architecture is working correctly.")
        return True
    else:
        print("\n💥 Some tests failed. Please check the implementation.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)



