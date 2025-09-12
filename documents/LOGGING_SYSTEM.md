# 🔍 EVEP Logging System

## Overview

The EVEP platform now includes a comprehensive logging system for serious debugging and monitoring. This system provides structured logging, real-time monitoring, and powerful search capabilities across both frontend and backend.

## 🏗️ Architecture

### Backend Logging
- **Structured JSON logging** with context and metadata
- **Multiple log levels**: DEBUG, INFO, WARNING, ERROR, CRITICAL
- **Request tracking** with unique request IDs
- **Performance monitoring** with request timing
- **File rotation** to prevent disk space issues
- **Separate log files** for different concerns

### Frontend Logging
- **Client-side logging** with session tracking
- **Error capture** for unhandled exceptions
- **API call monitoring** with timing
- **User action tracking** for analytics
- **Remote logging** to backend for production

## 📁 Log Files

### Backend Logs (`backend/logs/`)
- **`evep.log`** - Main application logs
- **`evep_api.log`** - API-specific logs
- **`evep_errors.log`** - Error logs only
- **`evep_auth.log`** - Authentication events
- **`evep_database.log`** - Database operations

### Log Rotation
- **Max file size**: 10MB per log file
- **Backup count**: 5 rotated files
- **Automatic cleanup**: Old logs are automatically removed

## 🛠️ Usage

### Command Line Interface

The logging system includes a powerful CLI tool for log management:

```bash
# Show log status and file sizes
./scripts/logs.sh status

# Tail logs in real-time
./scripts/logs.sh tail main
./scripts/logs.sh tail api
./scripts/logs.sh tail errors
./scripts/logs.sh tail all

# Search logs
./scripts/logs.sh search "error" errors
./scripts/logs.sh search "health" main
./scripts/logs.sh search "user_id" all

# Show recent logs
./scripts/logs.sh recent 50 main
./scripts/logs.sh recent 100 api

# Clear logs
./scripts/logs.sh clear api
./scripts/logs.sh clear all
```

### Log Types
- **`main`** - Main application logs
- **`api`** - API-specific logs
- **`errors`** - Error logs only
- **`all`** - All log files

## 📊 Log Structure

### Backend Log Format (JSON)
```json
{
  "timestamp": "2025-08-28T07:38:29.200586",
  "level": "INFO",
  "logger": "evep",
  "module": "main",
  "function": "health_check",
  "line": 45,
  "message": "HTTP GET /health - 200 (0.003s)",
  "context": {
    "request_method": "GET",
    "request_path": "/health",
    "status_code": 200,
    "duration": 0.003,
    "request_id": "8a8c78db-34a4-43af-9160-61cf1b36b0e1",
    "response_size": "147"
  },
  "environment": "development",
  "service": "evep-backend"
}
```

### Frontend Log Format
```json
{
  "timestamp": "2025-08-28T14:38:29.200Z",
  "level": "info",
  "message": "API Call",
  "context": {
    "method": "POST",
    "url": "/api/v1/auth/login",
    "status": 200,
    "duration": 150
  },
  "userId": "user123",
  "sessionId": "session_1234567890_abc123",
  "url": "http://localhost:3013/login",
  "userAgent": "Mozilla/5.0..."
}
```

## 🔧 Configuration

### Environment Variables
```bash
# Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
LOG_LEVEL=INFO

# Environment
ENVIRONMENT=development
```

### Backend Configuration
The logging system is configured in `backend/app/core/logger.py`:
- **Console output**: Colored, formatted logs for development
- **File output**: JSON structured logs for production
- **Error handling**: Automatic error capture and logging
- **Request tracking**: Unique request IDs for tracing

### Frontend Configuration
The frontend logger is configured in `frontend/src/utils/logger.ts`:
- **Development mode**: Console output with detailed information
- **Production mode**: Remote logging to backend
- **Error capture**: Global error handling
- **Session tracking**: Unique session IDs

## 🚀 Features

### Request Tracking
Every HTTP request gets a unique request ID that appears in:
- Request logs
- Response headers (`X-Request-ID`)
- Error logs
- Performance metrics

### Performance Monitoring
- **Request timing**: Automatic duration calculation
- **Response sizes**: Track data transfer
- **API performance**: Monitor endpoint response times
- **Database operations**: Track query performance

### Error Handling
- **Automatic capture**: Unhandled exceptions
- **Stack traces**: Full error context
- **Request context**: Error correlation with requests
- **Error categorization**: Different log files for different error types

### Search and Filter
- **Text search**: Find specific terms across logs
- **Level filtering**: Filter by log level
- **Time-based**: Search within time ranges
- **Context search**: Search within log context

## 📈 Monitoring

### Real-time Monitoring
```bash
# Monitor all logs in real-time
./scripts/logs.sh tail all

# Monitor only errors
./scripts/logs.sh tail errors

# Monitor API performance
./scripts/logs.sh tail api
```

### Performance Metrics
- **Response times**: Track API performance
- **Error rates**: Monitor system health
- **User activity**: Track user interactions
- **System resources**: Monitor resource usage

### Alerting
The logging system can be integrated with monitoring tools:
- **Grafana**: Visualize log data
- **Prometheus**: Metrics collection
- **Kibana**: Log analysis
- **Custom alerts**: Based on log patterns

## 🔍 Debugging Examples

### Debug API Issues
```bash
# Search for API errors
./scripts/logs.sh search "500" api

# Monitor API performance
./scripts/logs.sh search "duration" api

# Find slow requests
./scripts/logs.sh search "0.1" api
```

### Debug Authentication
```bash
# Search for auth events
./scripts/logs.sh search "login" all

# Find failed logins
./scripts/logs.sh search "401" all

# Monitor auth performance
./scripts/logs.sh search "auth" main
```

### Debug Frontend Issues
```bash
# Search for frontend errors
./scripts/logs.sh search "Frontend log" main

# Find JavaScript errors
./scripts/logs.sh search "Global Error" main

# Monitor user actions
./scripts/logs.sh search "User Action" main
```

## 🛡️ Security

### Log Security
- **No sensitive data**: Passwords and tokens are not logged
- **Request IDs**: Track requests without exposing user data
- **IP logging**: Client IP addresses for security monitoring
- **User context**: User IDs for debugging without PII

### Access Control
- **File permissions**: Log files have restricted access
- **Rotation**: Old logs are automatically cleaned up
- **Backup**: Important logs can be backed up
- **Audit trail**: All log access is tracked

## 📋 Best Practices

### Development
1. **Use appropriate log levels**: DEBUG for development, INFO for production
2. **Include context**: Always provide relevant context in logs
3. **Use request IDs**: Correlate logs across services
4. **Monitor performance**: Track response times and errors

### Production
1. **Set appropriate log levels**: INFO or WARNING for production
2. **Monitor disk space**: Ensure log rotation is working
3. **Set up alerts**: Configure alerts for critical errors
4. **Regular cleanup**: Archive old logs periodically

### Debugging
1. **Start with errors**: Check error logs first
2. **Use request IDs**: Trace requests across services
3. **Search effectively**: Use specific search terms
4. **Monitor real-time**: Use tail for live debugging

## 🔗 Integration

### Monitoring Tools
- **Grafana**: Dashboard creation
- **Prometheus**: Metrics collection
- **Kibana**: Log analysis
- **ELK Stack**: Full logging pipeline

### CI/CD Integration
- **Build logs**: Track deployment issues
- **Test logs**: Monitor test failures
- **Deployment logs**: Track deployment success/failure

## 📞 Support

For logging system issues:
1. Check log file permissions
2. Verify disk space
3. Review log rotation settings
4. Check environment variables
5. Monitor log file sizes

---

**🎉 The EVEP logging system is now ready for serious debugging!**
