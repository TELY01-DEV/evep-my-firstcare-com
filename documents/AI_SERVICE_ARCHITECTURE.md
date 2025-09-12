# AI Service Architecture - EVEP Platform

## 🏗️ **Overview**

The EVEP Platform now uses a **separated AI/ML service architecture** that provides better resource management, scalability, and flexibility. AI services are completely isolated from the main EVEP backend and can be enabled/disabled as needed.

---

## 🎯 **Architecture Benefits**

### **1. Resource Isolation**
- **Independent Resource Allocation**: AI services have dedicated CPU and memory limits
- **No Impact on Main System**: AI processing won't affect EVEP core functionality
- **Scalable Resources**: Can allocate more resources to AI services independently

### **2. Operational Flexibility**
- **Enable/Disable on Demand**: Turn AI features on/off without affecting main system
- **Independent Updates**: Update AI services without touching main EVEP code
- **Cost Control**: Only run AI services when needed

### **3. Better Performance**
- **Dedicated Processing**: AI workloads don't compete with main system resources
- **Optimized Containers**: AI services are optimized for ML workloads
- **Background Processing**: Heavy AI tasks run in separate worker containers

### **4. Enhanced Monitoring**
- **Separate Health Checks**: Independent monitoring of AI services
- **Resource Metrics**: Track AI service resource usage separately
- **Detailed Logging**: AI-specific logging and error tracking

---

## 🏗️ **Service Architecture**

### **Service Components**

```
┌─────────────────────────────────────────────────────────────┐
│                    EVEP Platform                            │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Port 3013)  │  Admin Panel (Port 3015)          │
├─────────────────────────────────────────────────────────────┤
│                    Main Backend (Port 8013)                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  EVEP Core Services                                 │   │
│  │  • User Management                                  │   │
│  │  • Patient Management                               │   │
│  │  • Screening Management                             │   │
│  │  • Database Operations                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                │
│                           ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  AI Service Client                                  │   │
│  │  • HTTP Client to AI Service                        │   │
│  │  • Request/Response Handling                        │   │
│  │  • Error Handling & Fallbacks                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI/ML Services                           │
├─────────────────────────────────────────────────────────────┤
│  AI Service (Port 8001)  │  AI Worker (Background)         │
│  ┌─────────────────────┐ │  ┌─────────────────────────────┐ │
│  │  • LLM Integration  │ │  │  • Background Processing    │ │
│  │  • Vector Store     │ │  │  • Batch Operations         │ │
│  │  • Prompt Manager   │ │  │  • Queue Management         │ │
│  │  • Insight Gen.     │ │  │  • Resource Optimization    │ │
│  └─────────────────────┘ │  └─────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  AI Monitor (Port 8002)                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • Performance Metrics                              │   │
│  │  • Resource Monitoring                              │   │
│  │  • Health Checks                                    │   │
│  │  • Alerting                                         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### **Service Details**

#### **1. AI Service (Port 8001)**
- **Purpose**: Main AI/ML API service
- **Features**: 
  - LLM integration (OpenAI, Claude)
  - Vector embeddings and similarity search
  - AI insight generation
  - Prompt template management
- **Resources**: 4GB RAM, 2 CPU cores
- **Health Check**: `/health` endpoint

#### **2. AI Worker (Background)**
- **Purpose**: Background processing for heavy AI tasks
- **Features**:
  - Batch insight generation
  - Queue processing
  - Resource optimization
- **Resources**: 2GB RAM, 1 CPU core
- **Dependencies**: Redis for job queue

#### **3. AI Monitor (Port 8002)**
- **Purpose**: Monitoring and metrics for AI services
- **Features**:
  - Performance metrics
  - Resource usage tracking
  - Health monitoring
  - Prometheus metrics
- **Resources**: Minimal (monitoring only)

---

## 🔧 **Configuration**

### **Environment Variables**

#### **AI Service Configuration (`ai-service.env`)**
```bash
# Enable/Disable AI Services
AI_SERVICE_ENABLED=true

# AI Service URL
AI_SERVICE_URL=http://ai-service:8001

# API Keys
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Performance Settings
AI_MAX_CONCURRENT_REQUESTS=5
AI_REQUEST_TIMEOUT=60
AI_MAX_WORKERS=3

# Resource Limits
AI_MEMORY_LIMIT=4G
AI_CPU_LIMIT=2.0
```

#### **Main Backend Configuration**
```bash
# AI Service Integration
AI_SERVICE_ENABLED=true
AI_SERVICE_URL=http://ai-service:8001
AI_SERVICE_TIMEOUT=30
```

### **Docker Compose Profiles**

AI services use Docker Compose profiles for selective deployment:

```yaml
# Enable AI services
docker-compose --profile ai up -d

# Disable AI services (only main services)
docker-compose up -d
```

---

## 🚀 **Management Commands**

### **AI Service Management Script**

The platform includes a comprehensive management script:

```bash
# Enable AI services
./scripts/manage-ai-services.sh enable

# Disable AI services
./scripts/manage-ai-services.sh disable

# Check status
./scripts/manage-ai-services.sh status

# View logs
./scripts/manage-ai-services.sh logs

# Restart services
./scripts/manage-ai-services.sh restart

# Rebuild services
./scripts/manage-ai-services.sh rebuild
```

### **Manual Docker Commands**

```bash
# Start AI services
docker-compose --profile ai up -d ai-service ai-worker ai-monitor

# Stop AI services
docker-compose --profile ai stop ai-service ai-worker ai-monitor

# View AI service logs
docker-compose --profile ai logs -f ai-service

# Check AI service health
curl http://localhost:8001/health
```

---

## 🔄 **Integration Flow**

### **1. Request Flow**
```
Frontend → Main Backend → AI Service Client → AI Service → Response
```

### **2. AI Service Client**
The main backend uses an `AIServiceClient` to communicate with AI services:

```python
from app.services.ai_client import ai_client

# Generate insight
insight = await ai_client.generate_insight(
    screening_data=data,
    role="doctor",
    insight_type="screening_analysis"
)

# Search insights
results = await ai_client.search_insights(
    query="vision screening",
    n_results=10
)
```

### **3. Error Handling**
- **Service Unavailable**: Graceful fallback when AI services are disabled
- **Timeout Handling**: Configurable timeouts for AI requests
- **Retry Logic**: Automatic retries for transient failures
- **Circuit Breaker**: Prevents cascading failures

---

## 📊 **Monitoring & Health Checks**

### **Health Check Endpoints**

#### **AI Service Health**
```bash
# Basic health check
GET http://localhost:8001/health

# Readiness check (Kubernetes)
GET http://localhost:8001/health/ready

# Liveness check (Kubernetes)
GET http://localhost:8001/health/live
```

#### **Response Format**
```json
{
  "status": "healthy",
  "components": {
    "llm_service": true,
    "vector_store": true
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### **Metrics & Monitoring**

#### **AI Service Metrics (Port 8002)**
- Request count and latency
- Model usage statistics
- Resource utilization
- Error rates and types
- Queue depth and processing times

#### **Integration with Main Monitoring**
- AI service metrics integrated with main Prometheus/Grafana
- Unified dashboard for all services
- Alerting for AI service issues

---

## 🔒 **Security**

### **Service Isolation**
- **Network Isolation**: AI services on separate network
- **Resource Limits**: CPU and memory limits enforced
- **Access Control**: API key authentication for AI services
- **Data Protection**: Secure communication between services

### **API Security**
- **Authentication**: JWT tokens for main backend communication
- **Rate Limiting**: Configurable rate limits for AI endpoints
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error responses (no sensitive data)

---

## 🚀 **Deployment Scenarios**

### **1. Development Environment**
```bash
# Start without AI services
docker-compose up -d

# Enable AI services when needed
./scripts/manage-ai-services.sh enable
```

### **2. Production Environment**
```bash
# Start with AI services enabled
docker-compose --profile ai up -d

# Monitor AI services
./scripts/manage-ai-services.sh status
```

### **3. Resource-Constrained Environment**
```bash
# Start without AI services to save resources
docker-compose up -d

# Enable AI services only when needed
./scripts/manage-ai-services.sh enable
```

### **4. High-Performance Environment**
```bash
# Start with all services and increased resources
docker-compose --profile ai up -d

# Scale AI workers if needed
docker-compose --profile ai up -d --scale ai-worker=3
```

---

## 🔧 **Troubleshooting**

### **Common Issues**

#### **1. AI Service Not Starting**
```bash
# Check logs
./scripts/manage-ai-services.sh logs ai-service

# Check configuration
cat ai-service.env

# Rebuild service
./scripts/manage-ai-services.sh rebuild
```

#### **2. AI Service Unhealthy**
```bash
# Check health status
curl http://localhost:8001/health

# Check resource usage
docker stats ai-service

# Restart service
./scripts/manage-ai-services.sh restart
```

#### **3. Integration Issues**
```bash
# Check main backend logs
docker-compose logs backend

# Test AI service connectivity
curl http://ai-service:8001/health

# Verify configuration
echo $AI_SERVICE_ENABLED
echo $AI_SERVICE_URL
```

### **Debug Commands**

```bash
# Check all AI service status
./scripts/manage-ai-services.sh status

# View all AI service logs
./scripts/manage-ai-services.sh logs

# Test AI service endpoints
curl http://localhost:8001/api/v1/insights/statistics

# Check resource usage
docker stats $(docker-compose --profile ai ps -q)
```

---

## 📈 **Performance Optimization**

### **Resource Tuning**

#### **Memory Optimization**
```yaml
# Adjust based on available memory
deploy:
  resources:
    limits:
      memory: 4G  # Increase for larger models
    reservations:
      memory: 2G  # Minimum required
```

#### **CPU Optimization**
```yaml
# Adjust based on CPU cores
deploy:
  resources:
    limits:
      cpus: '2.0'  # Increase for faster processing
    reservations:
      cpus: '1.0'  # Minimum required
```

### **Scaling Strategies**

#### **Horizontal Scaling**
```bash
# Scale AI workers
docker-compose --profile ai up -d --scale ai-worker=3

# Scale AI service (if needed)
docker-compose --profile ai up -d --scale ai-service=2
```

#### **Vertical Scaling**
- Increase memory limits for larger models
- Increase CPU limits for faster processing
- Adjust timeout values based on workload

---

## 🎯 **Best Practices**

### **1. Resource Management**
- Monitor AI service resource usage
- Set appropriate limits based on workload
- Use resource reservations for critical services

### **2. Monitoring**
- Set up alerts for AI service health
- Monitor API response times
- Track AI service costs and usage

### **3. Security**
- Rotate API keys regularly
- Monitor AI service access logs
- Implement rate limiting

### **4. Backup & Recovery**
- Backup AI service data (ChromaDB)
- Document recovery procedures
- Test disaster recovery scenarios

---

## 🔮 **Future Enhancements**

### **Planned Features**
- **Auto-scaling**: Automatic scaling based on load
- **Model Caching**: Intelligent model caching
- **Multi-region**: Geographic distribution of AI services
- **Advanced Monitoring**: ML-specific monitoring and alerting

### **Integration Opportunities**
- **Kubernetes**: Native Kubernetes deployment
- **Cloud AI**: Integration with cloud AI services
- **Edge Computing**: Edge AI processing capabilities
- **Federated Learning**: Distributed AI training

---

*This architecture provides a robust, scalable, and flexible foundation for AI/ML capabilities in the EVEP Platform while maintaining system stability and operational efficiency.*

