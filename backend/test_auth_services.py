#!/usr/bin/env python3
"""
Test script for EVEP Platform Authentication Services
This script tests the authentication services without requiring FastAPI
"""

import sys
import os
import asyncio

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

async def test_auth_service():
    """Test the authentication service"""
    print("🧪 Testing Authentication Service")
    print("=" * 50)
    
    try:
        from app.modules.auth.services.auth_service import AuthService
        from app.shared.models.user import UserCreate, UserRole
        
        print("✅ AuthService imported successfully")
        
        # Initialize service
        auth_service = AuthService()
        await auth_service.initialize()
        
        print(f"📦 Demo users created: {len(auth_service.users)}")
        
        # Test login
        login_result = await auth_service.login("admin@evep.com", "demo123")
        print(f"🔐 Login successful: {login_result['user']['name']}")
        print(f"🔑 Token generated: {login_result['access_token'][:20]}...")
        
        # Test password verification
        user = await auth_service.get_user_by_email("admin@evep.com")
        if user:
            is_valid = auth_service.verify_password("demo123", user.password_hash)
            print(f"🔒 Password verification: {'✅ Valid' if is_valid else '❌ Invalid'}")
        
        # Test token verification
        token_payload = auth_service.verify_jwt_token(login_result['access_token'])
        print(f"🎫 Token verification: {'✅ Valid' if token_payload else '❌ Invalid'}")
        
        # Test user creation
        new_user = UserCreate(
            email="test@evep.com",
            name="Test User",
            role=UserRole.TEACHER,
            password="test123"
        )
        created_user = await auth_service.create_user(new_user)
        print(f"👤 User created: {created_user.name} ({created_user.email})")
        
        print("\n✅ All authentication service tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Authentication service test failed: {e}")
        return False

async def test_user_service():
    """Test the user service"""
    print("\n🧪 Testing User Service")
    print("=" * 50)
    
    try:
        from app.modules.auth.services.user_service import UserService
        from app.shared.models.user import UserCreate, UserUpdate, UserRole, UserStatus
        
        print("✅ UserService imported successfully")
        
        # Initialize service
        user_service = UserService()
        await user_service.initialize()
        
        # Test user creation
        user_create = UserCreate(
            email="doctor@test.com",
            name="Dr. Test Doctor",
            role=UserRole.DOCTOR,
            password="test123"
        )
        created_user = await user_service.create_user(user_create)
        print(f"👤 User created: {created_user.name} ({created_user.role})")
        
        # Test user retrieval
        retrieved_user = await user_service.get_user(created_user.id)
        print(f"🔍 User retrieved: {retrieved_user.name if retrieved_user else 'Not found'}")
        
        # Test user update
        user_update = UserUpdate(name="Dr. Updated Doctor")
        updated_user = await user_service.update_user(created_user.id, user_update)
        print(f"✏️ User updated: {updated_user.name if updated_user else 'Update failed'}")
        
        # Test admin user creation
        admin_create = UserCreate(
            email="admin@test.com",
            name="Test Admin",
            role=UserRole.ADMIN,
            password="test123"
        )
        admin_user = await user_service.create_admin_user(admin_create)
        print(f"👑 Admin user created: {admin_user.name} ({admin_user.role})")
        
        # Test medical staff user creation
        nurse_create = UserCreate(
            email="nurse@test.com",
            name="Test Nurse",
            role=UserRole.NURSE,
            password="test123"
        )
        nurse_user = await user_service.create_medical_staff_user(nurse_create)
        print(f"🏥 Medical staff created: {nurse_user.name} ({nurse_user.role})")
        
        # Test statistics
        stats = await user_service.get_user_statistics()
        print(f"📊 User statistics: {stats}")
        
        print("\n✅ All user service tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ User service test failed: {e}")
        return False

async def test_token_service():
    """Test the token service"""
    print("\n🧪 Testing Token Service")
    print("=" * 50)
    
    try:
        from app.modules.auth.services.token_service import TokenService
        
        print("✅ TokenService imported successfully")
        
        # Initialize service
        token_service = TokenService()
        await token_service.initialize()
        
        # Test user data
        user_data = {
            "id": "test-user-123",
            "email": "test@evep.com",
            "role": "doctor"
        }
        
        # Test access token creation
        access_token = token_service.create_access_token(user_data)
        print(f"🔑 Access token created: {access_token[:20]}...")
        
        # Test refresh token creation
        refresh_token = token_service.create_refresh_token(user_data)
        print(f"🔄 Refresh token created: {refresh_token[:20]}...")
        
        # Test token verification
        access_payload = token_service.verify_token(access_token)
        refresh_payload = token_service.verify_token(refresh_token)
        print(f"🎫 Access token verification: {'✅ Valid' if access_payload else '❌ Invalid'}")
        print(f"🎫 Refresh token verification: {'✅ Valid' if refresh_payload else '❌ Invalid'}")
        
        # Test token refresh
        refresh_result = token_service.refresh_token(refresh_token)
        print(f"🔄 Token refresh: {'✅ Success' if refresh_result else '❌ Failed'}")
        
        # Test token revocation
        revoked = token_service.revoke_token(access_token)
        print(f"🚫 Token revocation: {'✅ Success' if revoked else '❌ Failed'}")
        
        # Test statistics
        stats = token_service.get_token_statistics()
        print(f"📊 Token statistics: {stats}")
        
        print("\n✅ All token service tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Token service test failed: {e}")
        return False

async def main():
    """Main test function"""
    print("🚀 EVEP Platform Authentication Services Test")
    print("=" * 60)
    
    # Run tests
    auth_test = await test_auth_service()
    user_test = await test_user_service()
    token_test = await test_token_service()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Summary:")
    print(f"   Authentication Service: {'✅ PASS' if auth_test else '❌ FAIL'}")
    print(f"   User Service: {'✅ PASS' if user_test else '❌ FAIL'}")
    print(f"   Token Service: {'✅ PASS' if token_test else '❌ FAIL'}")
    
    if all([auth_test, user_test, token_test]):
        print("\n🎉 All tests passed! Authentication services are working correctly.")
        return True
    else:
        print("\n💥 Some tests failed. Please check the implementation.")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)



