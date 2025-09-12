#!/usr/bin/env python3
"""
Test script to verify OpenAI and Anthropic API keys
"""

import os
import asyncio
from openai import AsyncOpenAI
import anthropic

async def test_openai_api():
    """Test OpenAI API key"""
    print("🔍 Testing OpenAI API key...")
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ OPENAI_API_KEY not found in environment")
        return False
    
    try:
        client = AsyncOpenAI(api_key=api_key)
        
        # Test with a simple completion
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "Hello, this is a test. Please respond with 'API test successful'."}],
            max_tokens=10
        )
        
        print(f"✅ OpenAI API test successful!")
        print(f"   Model: gpt-3.5-turbo")
        print(f"   Response: {response.choices[0].message.content}")
        print(f"   Usage: {response.usage}")
        return True
        
    except Exception as e:
        print(f"❌ OpenAI API test failed: {e}")
        return False

async def test_anthropic_api():
    """Test Anthropic API key"""
    print("\n🔍 Testing Anthropic API key...")
    
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ ANTHROPIC_API_KEY not found in environment")
        return False
    
    try:
        client = anthropic.AsyncAnthropic(api_key=api_key)
        
        # Test with the older API syntax for version 0.7.7
        response = await client.completions.create(
            model="claude-2.1",
            max_tokens_to_sample=10,
            prompt="\n\nHuman: Hello, this is a test. Please respond with 'API test successful'.\n\nAssistant:"
        )
        
        print(f"✅ Anthropic API test successful!")
        print(f"   Model: claude-2.1")
        print(f"   Response: {response.completion}")
        return True
        
    except Exception as e:
        print(f"❌ Anthropic API test failed: {e}")
        
        # Try alternative models with older syntax
        alternative_models = ["claude-2.1", "claude-instant-1.2"]
        
        for model in alternative_models:
            try:
                print(f"   Trying alternative model: {model}")
                response = await client.completions.create(
                    model=model,
                    max_tokens_to_sample=10,
                    prompt="\n\nHuman: Hello, this is a test.\n\nAssistant:"
                )
                print(f"✅ Anthropic API test successful with model: {model}")
                print(f"   Response: {response.completion}")
                return True
            except Exception as model_error:
                print(f"   ❌ Model {model} failed: {model_error}")
        
        return False

async def main():
    """Main test function"""
    print("🚀 Starting API Key Tests...\n")
    
    # Load environment variables from .env file
    if os.path.exists('.env'):
        with open('.env', 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value
        print("📁 Loaded environment variables from .env file")
    
    print(f"🔑 OpenAI API Key: {os.getenv('OPENAI_API_KEY', 'Not found')[:20]}...")
    print(f"🔑 Anthropic API Key: {os.getenv('ANTHROPIC_API_KEY', 'Not found')[:20]}...\n")
    
    openai_success = await test_openai_api()
    anthropic_success = await test_anthropic_api()
    
    print("\n" + "="*50)
    print("📊 TEST RESULTS SUMMARY")
    print("="*50)
    print(f"OpenAI API: {'✅ WORKING' if openai_success else '❌ FAILED'}")
    print(f"Anthropic API: {'✅ WORKING' if anthropic_success else '❌ FAILED'}")
    
    if openai_success or anthropic_success:
        print("\n🎉 At least one API key is working!")
        if openai_success:
            print("   - OpenAI can be used for AI insights")
        if anthropic_success:
            print("   - Anthropic can be used for AI insights")
    else:
        print("\n⚠️  No API keys are working. Please check your API keys and try again.")

if __name__ == "__main__":
    asyncio.run(main())
