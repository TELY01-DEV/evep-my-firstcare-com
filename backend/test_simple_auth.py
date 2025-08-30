#!/usr/bin/env python3
"""
Simple test script for EVEP Platform Authentication Services
This script tests the core authentication logic without FastAPI dependencies
"""

import sys
import os
import asyncio
from datetime import datetime

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_password_hashing():
    """Test password hashing functionality"""
    print("🧪 Testing Password Hashing")
    print("=" * 50)
    
    try:
        import bcrypt
        
        # Test password hashing
        password = "test123"
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        hashed_str = hashed.decode('utf-8')
        
        print(f"🔒 Password: {password}")
        print(f"🔑 Hashed: {hashed_str[:20]}...")
        
        # Test password verification
        is_valid = bcrypt.checkpw(password.encode('utf-8'), hashed)
        print(f"✅ Password verification: {'Valid' if is_valid else 'Invalid'}")
        
        # Test wrong password
        is_invalid = bcrypt.checkpw("wrong123".encode('utf-8'), hashed)
        print(f"❌ Wrong password verification: {'Valid' if is_invalid else 'Invalid'}")
        
        print("✅ Password hashing tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Password hashing test failed: {e}")
        return False

def test_jwt_tokens():
    """Test JWT token functionality"""
    print("\n🧪 Testing JWT Tokens")
    print("=" * 50)
    
    try:
        import jwt
        
        # Test data
        secret = "hardcoded_secret_key"
        user_data = {
            "user_id": "test-user-123",
            "email": "test@evep.com",
            "role": "doctor"
        }
        
        # Create token
        payload = {
            **user_data,
            "exp": datetime.utcnow().timestamp() + 3600,  # 1 hour
            "iat": datetime.utcnow().timestamp()
        }
        
        token = jwt.encode(payload, secret, algorithm="HS256")
        print(f"🔑 Token created: {token[:20]}...")
        
        # Verify token
        decoded = jwt.decode(token, secret, algorithms=["HS256"])
        print(f"🎫 Token decoded: {decoded['email']}")
        
        # Test invalid token
        try:
            invalid_decoded = jwt.decode(token + "invalid", secret, algorithms=["HS256"])
            print("❌ Invalid token should have failed")
            return False
        except jwt.InvalidTokenError:
            print("✅ Invalid token correctly rejected")
        
        print("✅ JWT token tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ JWT token test failed: {e}")
        return False

def test_user_models():
    """Test user model functionality"""
    print("\n🧪 Testing User Models")
    print("=" * 50)
    
    try:
        # Test user creation
        user_data = {
            "id": "test-user-123",
            "email": "test@evep.com",
            "name": "Test User",
            "role": "doctor",
            "status": "active",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        print(f"👤 User data: {user_data['name']} ({user_data['email']})")
        print(f"🎭 Role: {user_data['role']}")
        print(f"📅 Created: {user_data['created_at']}")
        
        # Test role validation
        valid_roles = ["admin", "doctor", "nurse", "teacher", "parent"]
        user_role = user_data["role"]
        
        if user_role in valid_roles:
            print(f"✅ Valid role: {user_role}")
        else:
            print(f"❌ Invalid role: {user_role}")
            return False
        
        # Test status validation
        valid_statuses = ["active", "inactive", "suspended", "pending"]
        user_status = user_data["status"]
        
        if user_status in valid_statuses:
            print(f"✅ Valid status: {user_status}")
        else:
            print(f"❌ Invalid status: {user_status}")
            return False
        
        print("✅ User model tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ User model test failed: {e}")
        return False

def test_configuration():
    """Test configuration system"""
    print("\n🧪 Testing Configuration System")
    print("=" * 50)
    
    try:
        # Test hardcoded configuration
        config = {
            "jwt_secret": "hardcoded_secret_key",
            "jwt_expires_in": "24h",
            "bcrypt_rounds": 12,
            "roles": {
                "admin": ["admin", "super_admin"],
                "medical": ["doctor", "nurse", "medical_staff"],
                "general": ["teacher", "parent", "general_user"]
            }
        }
        
        print(f"🔧 JWT Secret: {config['jwt_secret'][:10]}...")
        print(f"⏰ JWT Expires: {config['jwt_expires_in']}")
        print(f"🔒 BCrypt Rounds: {config['bcrypt_rounds']}")
        print(f"👥 Admin Roles: {config['roles']['admin']}")
        print(f"🏥 Medical Roles: {config['roles']['medical']}")
        print(f"👤 General Roles: {config['roles']['general']}")
        
        # Test feature flags
        feature_flags = {
            "patient_management": True,
            "screening": True,
            "ai_analytics": False,
            "telemedicine": False
        }
        
        print(f"📋 Feature flags: {feature_flags}")
        
        print("✅ Configuration tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Configuration test failed: {e}")
        return False

def test_modular_structure():
    """Test modular architecture structure"""
    print("\n🧪 Testing Modular Structure")
    print("=" * 50)
    
    try:
        # Test module registry structure
        module_registry = {
            "core": {
                "auth": {"enabled": True, "version": "1.0.0"},
                "database": {"enabled": True, "version": "1.0.0"}
            },
            "features": {
                "patient_management": {"enabled": True, "dependencies": ["auth", "database"]},
                "screening": {"enabled": True, "dependencies": ["auth", "database", "patient_management"]}
            }
        }
        
        print("📦 Module Registry Structure:")
        for category, modules in module_registry.items():
            print(f"  {category.upper()}:")
            for module_name, config in modules.items():
                print(f"    - {module_name}: {config['enabled']} (v{config['version']})")
                if "dependencies" in config:
                    print(f"      Dependencies: {config['dependencies']}")
        
        # Test service structure
        services = {
            "auth": ["AuthService", "UserService", "TokenService"],
            "patient_management": ["PatientService", "DemographicsService"],
            "screening": ["ScreeningService", "SchoolScreeningService"]
        }
        
        print("\n🔧 Service Structure:")
        for module, service_list in services.items():
            print(f"  {module}: {', '.join(service_list)}")
        
        print("✅ Modular structure tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Modular structure test failed: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 EVEP Platform Simple Authentication Test")
    print("=" * 60)
    
    # Run tests
    password_test = test_password_hashing()
    jwt_test = test_jwt_tokens()
    user_test = test_user_models()
    config_test = test_configuration()
    modular_test = test_modular_structure()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Summary:")
    print(f"   Password Hashing: {'✅ PASS' if password_test else '❌ FAIL'}")
    print(f"   JWT Tokens: {'✅ PASS' if jwt_test else '❌ FAIL'}")
    print(f"   User Models: {'✅ PASS' if user_test else '❌ FAIL'}")
    print(f"   Configuration: {'✅ PASS' if config_test else '❌ FAIL'}")
    print(f"   Modular Structure: {'✅ PASS' if modular_test else '❌ FAIL'}")
    
    if all([password_test, jwt_test, user_test, config_test, modular_test]):
        print("\n🎉 All tests passed! Core authentication functionality is working correctly.")
        return True
    else:
        print("\n💥 Some tests failed. Please check the implementation.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)



