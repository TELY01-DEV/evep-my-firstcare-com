#!/usr/bin/env python3
"""
Setup Telegram Webhook for EVEP Platform
This script configures the Telegram bot webhook to receive messages
"""

import requests
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env')

def setup_telegram_webhook():
    """Setup Telegram webhook"""
    
    bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
    chat_id = os.getenv('TELEGRAM_CHAT_ID')
    
    if not bot_token or not chat_id:
        print("❌ Error: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set in environment")
        return False
    
    # Get the webhook URL (replace with your actual domain)
    webhook_url = "https://stardust.evep.my-firstcare.com/api/v1/telegram/webhook"
    
    # Set webhook
    webhook_url_full = f"https://api.telegram.org/bot{bot_token}/setWebhook"
    
    payload = {
        "url": webhook_url
    }
    
    try:
        print(f"🔧 Setting up Telegram webhook...")
        print(f"📡 Webhook URL: {webhook_url}")
        
        response = requests.post(webhook_url_full, json=payload)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('ok'):
                print("✅ Telegram webhook set up successfully!")
                print(f"📋 Description: {result.get('description', 'No description')}")
                return True
            else:
                print(f"❌ Error setting webhook: {result.get('description', 'Unknown error')}")
                return False
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def test_telegram_bot():
    """Test Telegram bot by sending a test message"""
    
    bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
    chat_id = os.getenv('TELEGRAM_CHAT_ID')
    
    if not bot_token or not chat_id:
        print("❌ Error: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set in environment")
        return False
    
    # Send test message
    send_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    
    payload = {
        "chat_id": chat_id,
        "text": "🤖 EVEP Telegram Bot is now active!\n\nYou can now receive notifications for new user registrations and approve users via commands:\n\n✅ /approve user_id\n❌ /reject user_id",
        "parse_mode": "Markdown"
    }
    
    try:
        print(f"📤 Sending test message to chat {chat_id}...")
        
        response = requests.post(send_url, json=payload)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('ok'):
                print("✅ Test message sent successfully!")
                return True
            else:
                print(f"❌ Error sending message: {result.get('description', 'Unknown error')}")
                return False
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def get_webhook_info():
    """Get current webhook information"""
    
    bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
    
    if not bot_token:
        print("❌ Error: TELEGRAM_BOT_TOKEN must be set in environment")
        return False
    
    # Get webhook info
    info_url = f"https://api.telegram.org/bot{bot_token}/getWebhookInfo"
    
    try:
        print(f"🔍 Getting webhook information...")
        
        response = requests.get(info_url)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('ok'):
                webhook_info = result.get('result', {})
                print("📋 Current webhook information:")
                print(f"   URL: {webhook_info.get('url', 'Not set')}")
                print(f"   Has custom certificate: {webhook_info.get('has_custom_certificate', False)}")
                print(f"   Pending update count: {webhook_info.get('pending_update_count', 0)}")
                print(f"   Last error date: {webhook_info.get('last_error_date', 'None')}")
                print(f"   Last error message: {webhook_info.get('last_error_message', 'None')}")
                return True
            else:
                print(f"❌ Error getting webhook info: {result.get('description', 'Unknown error')}")
                return False
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

if __name__ == "__main__":
    print("🚀 EVEP Telegram Bot Setup")
    print("=" * 50)
    
    # Get current webhook info
    get_webhook_info()
    print()
    
    # Setup webhook
    if setup_telegram_webhook():
        print()
        # Test the bot
        test_telegram_bot()
    else:
        print("❌ Failed to setup webhook")
        sys.exit(1)
    
    print("\n🎉 Setup complete!")
    print("\n📝 Next steps:")
    print("1. Make sure your server is accessible from the internet")
    print("2. Test user registration to see notifications")
    print("3. Use /approve <user_id> or /reject <user_id> commands in Telegram")
