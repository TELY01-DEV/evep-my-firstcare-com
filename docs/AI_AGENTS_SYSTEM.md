# EVEP Medical Portal - AI Agents System Documentation

## Overview

The EVEP Medical Portal features a comprehensive AI Agents System that provides intelligent, context-aware assistance to different user types. The system is designed with a **database-driven architecture** that allows for dynamic configuration and real-time updates without code changes.

## 🏗️ System Architecture

### Core Components

1. **Database Agent Manager** (`database_agent_manager.py`)
   - Singleton pattern for consistent state management
   - Dynamic configuration loading from MongoDB
   - Fallback system for reliability
   - Caching for performance optimization

2. **Chat Database** (`chat_database.py`)
   - MongoDB integration for agent configurations
   - CRUD operations for agent management
   - Conversation history storage
   - AI learning data persistence

3. **API Endpoints** (`chat_bot.py`)
   - RESTful API for agent interactions
   - Administrative management endpoints
   - Performance monitoring
   - Cache management

4. **Frontend Integration**
   - React-based chat interface
   - Real-time messaging
   - User type-based agent routing
   - Bilingual support (English/Thai)

## 🤖 AI Agent Types

### 1. Super Admin Agent
- **User Type**: `super_admin`
- **Focus**: System usage, data querying, analytics access
- **Capabilities**: 
  - Guide on system navigation and features
  - Help with data export and filtering
  - Analytics dashboard access
  - Administrative functions

### 2. Doctor Agent
- **User Type**: `doctor`
- **Focus**: Clinical workflows, patient data, medical analytics
- **Capabilities**:
  - Patient data querying
  - Medical report generation
  - Clinical workflow guidance
  - Diagnostic tool assistance

### 3. Nurse Agent
- **User Type**: `nurse`
- **Focus**: Patient care workflows, care analytics
- **Capabilities**:
  - Patient care data management
  - Care report generation
  - Care workflow navigation
  - Patient monitoring assistance

### 4. Optometrist Agent (นักทัศนมาตร)
- **User Type**: `optometrist`
- **Focus**: Vision care, optical analytics
- **Capabilities**:
  - Vision screening data management
  - Eye examination results
  - Visual acuity testing guidance
  - Optical report generation

### 5. Medical Staff Agent
- **User Type**: `medical_staff`
- **Focus**: Medical support workflows
- **Capabilities**:
  - Medical data entry and management
  - Support workflow guidance
  - Medical report assistance
  - Patient information access

### 6. Hospital Staff Agent
- **User Type**: `hospital_staff`
- **Focus**: Hospital operations and workflows
- **Capabilities**:
  - Hospital workflow guidance
  - Operational data access
  - Hospital report generation
  - Administrative support

### 7. Hospital Exclusive Agent
- **User Type**: `hospital_exclusive`
- **Focus**: Exclusive hospital services
- **Capabilities**:
  - Premium service guidance
  - Exclusive data access
  - Specialized reporting
  - VIP patient support

### 8. Medical Admin Agent
- **User Type**: `medical_admin`
- **Focus**: Medical administration and management
- **Capabilities**:
  - Medical administration workflows
  - Staff management guidance
  - Medical policy assistance
  - Quality assurance support

### 9. System Admin Agent
- **User Type**: `system_admin`
- **Focus**: System administration and maintenance
- **Capabilities**:
  - System configuration guidance
  - User management assistance
  - System monitoring support
  - Technical troubleshooting

### 10. Executive Agent
- **User Type**: `executive`
- **Focus**: Strategic insights and decision support
- **Capabilities**:
  - Strategic analytics access
  - Executive reporting
  - Performance insights
  - Decision support tools

### 11. Parent Agent
- **User Type**: `parent`
- **Focus**: Student health monitoring and LINE Bot integration
- **Capabilities**:
  - Student health data access
  - LINE Bot interaction guidance
  - Health monitoring assistance
  - Communication with school

### 12. Teacher Agent
- **User Type**: `teacher`
- **Focus**: Educational support and student health
- **Capabilities**:
  - Student health monitoring
  - Educational workflow guidance
  - Health screening assistance
  - Parent communication support

## 🗄️ Database Schema

### AI Agent Configurations Collection

```javascript
{
  "_id": ObjectId,
  "agent_type": "super_admin_agent",
  "user_type": "super_admin",
  "system_prompt": "You are a specialized assistant...",
  "capabilities": [
    "Guide on how to use the EVEP system effectively",
    "Show how to query and retrieve data from all modules",
    "Help access and interpret system analytics and reports"
  ],
  "fallback_response": "I'm your super administrative assistant...",
  "is_active": true,
  "created_at": ISODate,
  "updated_at": ISODate
}
```

### Conversation History Collection

```javascript
{
  "_id": ObjectId,
  "user_id": "user123",
  "user_type": "super_admin",
  "messages": [
    {
      "message": "How do I access analytics?",
      "is_user": true,
      "timestamp": ISODate
    },
    {
      "message": "To access analytics, follow these steps...",
      "is_user": false,
      "agent_type": "super_admin_agent",
      "timestamp": ISODate
    }
  ],
  "created_at": ISODate,
  "updated_at": ISODate
}
```

## 🔧 API Endpoints

### Chat Bot Endpoints

#### `POST /api/v1/chat-bot/ai-agent`
- **Purpose**: Get AI agent response
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "message": "How do I access system analytics?",
    "context": {
      "user_type": "super_admin",
      "session_id": "session123"
    }
  }
  ```
- **Response**:
  ```json
  {
    "response": "To access system analytics...",
    "agent_type": "super_admin_agent",
    "confidence": 0.9,
    "cached": false,
    "timestamp": "2024-01-01T00:00:00Z"
  }
  ```

#### `GET /api/v1/chat-bot/agent-configs`
- **Purpose**: Get all agent configurations (Admin only)
- **Authentication**: Required (Admin role)
- **Response**:
  ```json
  {
    "total_configs": 12,
    "configurations": [
      {
        "agent_type": "super_admin_agent",
        "user_type": "super_admin",
        "is_active": true,
        "capabilities": ["System guidance", "Data querying"]
      }
    ]
  }
  ```

#### `PUT /api/v1/chat-bot/agent-configs/{agent_type}`
- **Purpose**: Update agent configuration (Admin only)
- **Authentication**: Required (Admin role)
- **Request Body**:
  ```json
  {
    "system_prompt": "Updated system prompt...",
    "capabilities": ["Updated capability"],
    "fallback_response": "Updated fallback response...",
    "is_active": true
  }
  ```

#### `POST /api/v1/chat-bot/agent-configs/reload`
- **Purpose**: Reload agent configurations from database (Admin only)
- **Authentication**: Required (Admin role)

#### `GET /api/v1/chat-bot/performance`
- **Purpose**: Get performance metrics
- **Authentication**: Required
- **Response**:
  ```json
  {
    "performance_metrics": {
      "total_agents": 12,
      "openai_configured": true,
      "cache_stats": {
        "cache_size": 150,
        "cache_hit_ratio": 0.75
      },
      "database_driven": true
    }
  }
  ```

#### `POST /api/v1/chat-bot/cache/clear`
- **Purpose**: Clear response cache (Admin only)
- **Authentication**: Required (Admin role)

## 🚀 Key Features

### 1. Database-Driven Configuration
- **Dynamic Updates**: Change agent behavior without code deployment
- **Real-time Configuration**: Update system prompts and capabilities instantly
- **Version Control**: Track configuration changes over time
- **A/B Testing**: Test different agent configurations

### 2. Intelligent Caching
- **Response Caching**: Cache frequently asked questions
- **TTL Management**: Configurable cache expiration
- **Cache Statistics**: Monitor cache performance
- **Memory Management**: Automatic cache size limits

### 3. Fallback System
- **Database Unavailable**: Graceful degradation to hardcoded responses
- **OpenAI Errors**: Fallback to predefined responses
- **Configuration Errors**: Error handling and recovery
- **Network Issues**: Robust error handling

### 4. Performance Monitoring
- **Request Tracking**: Monitor total requests and cache hits
- **Response Times**: Track agent response performance
- **Error Rates**: Monitor system reliability
- **Usage Analytics**: Track agent usage patterns

### 5. Bilingual Support
- **English Responses**: Primary language support
- **Thai Language**: Full Thai language support (ภาษาไทย)
- **Context Awareness**: Language-appropriate responses
- **Cultural Adaptation**: Thai cultural context in responses

## 🔒 Security Features

### 1. Authentication & Authorization
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: User type-based agent routing
- **Admin Controls**: Restricted configuration management
- **Session Management**: Secure session handling

### 2. Data Protection
- **Input Validation**: Sanitize user inputs
- **Error Handling**: Secure error messages
- **Rate Limiting**: Prevent abuse
- **Audit Logging**: Track system usage

## 📊 Performance Optimization

### 1. Caching Strategy
- **Response Caching**: Cache common responses
- **Configuration Caching**: Cache agent configurations
- **Database Connection Pooling**: Optimize database connections
- **Memory Management**: Efficient memory usage

### 2. Scalability
- **Singleton Pattern**: Single instance management
- **Async Operations**: Non-blocking operations
- **Connection Pooling**: Efficient resource usage
- **Load Balancing**: Distribute system load

## 🛠️ Configuration Management

### 1. Environment Variables
```bash
# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here

# Database Configuration
MONGODB_URL=mongodb://localhost:27017
MONGO_DATABASE=evep_medical_portal

# System Configuration
CHROMA_ANONYMIZED_TELEMETRY=false
```

### 2. Agent Configuration
- **System Prompts**: Define agent behavior and personality
- **Capabilities**: List agent capabilities and skills
- **Fallback Responses**: Default responses when AI unavailable
- **Active Status**: Enable/disable agents dynamically

## 📈 Monitoring & Analytics

### 1. Performance Metrics
- **Response Times**: Track agent response performance
- **Cache Hit Rates**: Monitor caching effectiveness
- **Error Rates**: Track system reliability
- **Usage Patterns**: Analyze user interactions

### 2. Learning Analytics
- **Conversation History**: Store user interactions
- **Intent Recognition**: Track user intent patterns
- **Response Effectiveness**: Monitor response quality
- **User Satisfaction**: Track user feedback

## 🔄 Maintenance & Updates

### 1. Configuration Updates
- **Real-time Updates**: Update configurations without restart
- **Rollback Support**: Revert to previous configurations
- **Version Control**: Track configuration changes
- **Testing Environment**: Test configurations before deployment

### 2. System Maintenance
- **Cache Management**: Clear and manage response cache
- **Database Maintenance**: Optimize database performance
- **Error Monitoring**: Track and resolve system errors
- **Performance Tuning**: Optimize system performance

## 🚀 Deployment

### 1. Production Deployment
- **Docker Containerization**: Containerized deployment
- **Environment Configuration**: Production environment setup
- **Database Migration**: Database schema updates
- **Service Restart**: Restart services after updates

### 2. Monitoring
- **Health Checks**: Monitor system health
- **Performance Monitoring**: Track system performance
- **Error Alerting**: Alert on system errors
- **Usage Analytics**: Monitor system usage

## 📚 Usage Examples

### 1. Basic Agent Interaction
```python
# Get agent response
response = await database_agent_manager.get_agent_response(
    user_type=UserType.SUPER_ADMIN,
    message="How do I access system analytics?",
    context={"session_id": "session123"}
)
```

### 2. Configuration Update
```python
# Update agent configuration
await chat_db.update_agent_config(
    "super_admin_agent",
    {
        "system_prompt": "Updated system prompt...",
        "capabilities": ["Updated capability"],
        "is_active": True
    }
)
```

### 3. Performance Monitoring
```python
# Get performance metrics
metrics = database_agent_manager.get_performance_metrics()
print(f"Cache hit ratio: {metrics['cache_stats']['cache_hit_ratio']}")
```

## 🎯 Best Practices

### 1. Agent Design
- **Clear System Prompts**: Define clear agent behavior
- **Focused Capabilities**: Keep capabilities specific and relevant
- **Fallback Responses**: Provide helpful fallback responses
- **User Context**: Consider user type and context

### 2. Performance
- **Caching Strategy**: Implement effective caching
- **Error Handling**: Robust error handling and recovery
- **Monitoring**: Continuous performance monitoring
- **Optimization**: Regular performance optimization

### 3. Security
- **Input Validation**: Validate all user inputs
- **Authentication**: Secure authentication and authorization
- **Error Handling**: Secure error messages
- **Audit Logging**: Comprehensive audit logging

## 🔮 Future Enhancements

### 1. Advanced Features
- **Multi-language Support**: Support for additional languages
- **Voice Integration**: Voice-based interactions
- **Advanced Analytics**: Enhanced analytics and insights
- **Machine Learning**: Improved learning algorithms

### 2. Integration
- **External APIs**: Integration with external services
- **Third-party Tools**: Integration with third-party tools
- **Mobile Support**: Enhanced mobile support
- **IoT Integration**: Internet of Things integration

---

## 📞 Support

For technical support or questions about the AI Agents System:

- **Documentation**: Refer to this comprehensive guide
- **API Reference**: Check the API endpoint documentation
- **Configuration**: Review configuration management section
- **Troubleshooting**: Check error handling and monitoring sections

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Status**: Production Ready ✅
