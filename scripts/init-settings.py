#!/usr/bin/env python3
"""
EVEP Platform - Settings Initialization Script
==============================================

This script initializes the MongoDB-based settings system with default values.

Usage:
    python scripts/init-settings.py
"""

import asyncio
import os
import sys

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.core.settings_manager import settings_manager

async def init_settings():
    """Initialize MongoDB-based settings"""
    
    print("🚀 Initializing EVEP Platform Settings...")
    print("=" * 50)
    
    try:
        # Initialize default settings
        await settings_manager.initialize_default_settings()
        
        print("\n✅ Settings initialized successfully!")
        print("=" * 50)
        
        # Display some key settings
        print("\n📋 Key Settings Overview:")
        print("-" * 30)
        
        # Get settings by category
        categories = ["system", "user", "security", "email", "notification", "storage", "analytics"]
        
        for category in categories:
            settings = await settings_manager.get_settings_by_category(category)
            if settings:
                print(f"\n🔧 {category.upper()} Settings:")
                for key, value in settings.items():
                    print(f"   {key}: {value}")
        
        print("\n🌐 Access Information:")
        print("-" * 30)
        print("   Settings API: http://localhost:8013/api/v1/admin/settings")
        print("   Admin Panel:  http://localhost:3015/admin/settings")
        
        print("\n⚠️  Notes:")
        print("-" * 30)
        print("   • Settings are stored in MongoDB for dynamic configuration")
        print("   • Sensitive data (passwords, keys) remain in environment variables")
        print("   • Settings can be updated via API or admin panel")
        print("   • Changes take effect immediately (with caching)")
        
    except Exception as e:
        print(f"❌ Error initializing settings: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(init_settings())



