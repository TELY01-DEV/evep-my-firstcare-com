# API Configuration & Reverse Proxy Setup

## Overview

This document describes the API configuration system for the EVEP My FirstCare application, including development and production environments, reverse proxy setup, and how to manage API endpoints.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL ACCESS                             │
├─────────────────────────────────────────────────────────────────┤
│ https://portal.evep.my-firstcare.com                          │
│ https://admin.evep.my-firstcare.com                           │
│ https://stardust.evep.my-firstcare.com                        │
│ https://cdn.evep.my-firstcare.com                             │
│ https://socketio.evep.my-firstcare.com                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REVERSE PROXY                               │
│                    (Nginx/HAProxy)                            │
├─────────────────────────────────────────────────────────────────┤
│ HTTPS → HTTP routing                                           │
│ SSL termination                                                │
│ Load balancing                                                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DOCKER NETWORK                              │
├─────────────────────────────────────────────────────────────────┤
│ Frontend:  localhost:3013                                     │
│ Backend:   localhost:8014                                     │
│ CDN:       localhost:3014                                     │
│ Admin:     localhost:3015                                     │
│ Socket.IO: localhost:9014                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Environment Configuration

### Development Environment

When running locally for development, the application uses direct localhost connections:

```typescript
// frontend/src/config/api.ts
const API_CONFIG = {
  development: {
    baseUrl: 'http://localhost:8014',        // Backend API
    frontendUrl: 'http://localhost:3000',    // Frontend dev server
    cdnUrl: 'http://localhost:3014',         // CDN service
    adminPanelUrl: 'http://localhost:3015',  // Admin panel
    socketUrl: 'http://localhost:9014'       // Socket.IO
  }
}
```

**Usage**: Run `npm start` or `yarn start` in development mode

### Production Environment

In production, the application uses external domain names that are routed through a reverse proxy:

```typescript
// frontend/src/config/api.ts
const API_CONFIG = {
  production: {
    baseUrl: 'https://stardust.evep.my-firstcare.com',      // Backend API
    frontendUrl: 'https://portal.evep.my-firstcare.com',    // Frontend
    cdnUrl: 'https://cdn.evep.my-firstcare.com',            // CDN service
    adminPanelUrl: 'https://admin.evep.my-firstcare.com',   // Admin panel
    socketUrl: 'https://socketio.evep.my-firstcare.com'     // Socket.IO
  }
}
```

**Usage**: Deployed containers automatically use production configuration

## Reverse Proxy Configuration

### Domain to Port Mapping

| External Domain | Internal Port | Service | Description |
|----------------|---------------|---------|-------------|
| `https://portal.evep.my-firstcare.com` | `localhost:3013` | Frontend | Main application interface |
| `https://admin.evep.my-firstcare.com` | `localhost:3015` | Admin Panel | Administrative interface |
| `https://stardust.evep.my-firstcare.com` | `localhost:8013` | Stardust API | REST API endpoints |
| `https://cdn.evep.my-firstcare.com` | `localhost:3014` | CDN Service | Static file delivery |
| `https://socketio.evep.my-firstcare.com` | `localhost:9014` | Socket.IO | Real-time communication |

### Additional Internal Services

| Service | Internal Port | Description |
|---------|---------------|-------------|
| `evep-backend` | `localhost:8014` | Legacy backend service |
| `ai-service` | `localhost:8015` | AI/ML service |
| `ai-monitor` | `localhost:8016` | AI monitoring service |

### Nginx Configuration Example

```nginx
# Frontend
server {
    listen 443 ssl;
    server_name portal.evep.my-firstcare.com;
    
    location / {
        proxy_pass http://localhost:3013;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend API
server {
    listen 443 ssl;
    server_name stardust.evep.my-firstcare.com;
    
    location / {
        proxy_pass http://localhost:8013;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Admin Panel
server {
    listen 443 ssl;
    server_name admin.evep.my-firstcare.com;
    
    location / {
        proxy_pass http://localhost:3015;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# CDN Service
server {
    listen 443 ssl;
    server_name cdn.evep.my-firstcare.com;
    
    location / {
        proxy_pass http://localhost:3014;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Socket.IO
server {
    listen 443 ssl;
    server_name socketio.evep.my-firstcare.com;
    
    location / {
        proxy_pass http://localhost:9014;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Configuration Files

### 1. Main API Configuration

**File**: `frontend/src/config/api.ts`

```typescript
import { API_ENDPOINTS } from './constants';

const API_CONFIG = {
  development: {
    baseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8014',
    frontendUrl: process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000',
    cdnUrl: process.env.REACT_APP_CDN_URL || 'http://localhost:3014',
    adminPanelUrl: process.env.REACT_APP_ADMIN_PANEL_URL || 'http://localhost:3015',
    socketUrl: process.env.REACT_APP_SOCKET_URL || 'http://localhost:9014'
  },
  production: {
    baseUrl: process.env.REACT_APP_API_BASE_URL || 'https://stardust.evep.my-firstcare.com',
    frontendUrl: process.env.REACT_APP_FRONTEND_URL || 'https://portal.evep.my-firstcare.com',
    cdnUrl: process.env.REACT_APP_CDN_URL || 'https://cdn.evep.my-firstcare.com',
    adminPanelUrl: process.env.REACT_APP_ADMIN_PANEL_URL || 'https://admin.evep.my-firstcare.com',
    socketUrl: process.env.REACT_APP_SOCKET_URL || 'https://socketio.evep.my-firstcare.com'
  }
};

// Auto-detect environment
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const currentConfig = isProduction ? API_CONFIG.production : API_CONFIG.development;
```

### 2. Constants File

**File**: `frontend/src/config/constants.ts`

```typescript
// Centralized API Configuration Constants
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 
  (process.env.NODE_ENV === 'production' ? 'https://stardust.evep.my-firstcare.com' : 'http://localhost:8014');

export const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL || 
  (process.env.NODE_ENV === 'production' ? 'https://portal.evep.my-firstcare.com' : 'http://localhost:3000');

export const CDN_URL = process.env.REACT_APP_CDN_URL || 
  (process.env.NODE_ENV === 'production' ? 'https://cdn.evep.my-firstcare.com' : 'http://localhost:3014');

export const ADMIN_PANEL_URL = process.env.REACT_APP_ADMIN_PANEL_URL || 
  (process.env.NODE_ENV === 'production' ? 'https://admin.evep.my-firstcare.com' : 'http://localhost:3015');

export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 
  (process.env.NODE_ENV === 'production' ? 'https://socketio.evep.my-firstcare.com' : 'http://localhost:9014');

// Pre-defined API endpoints
export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/api/v1/auth/login`,
  REGISTER: `${API_BASE_URL}/api/v1/auth/register`,
  PROFILE: `${API_BASE_URL}/api/v1/auth/me`,
  // ... more endpoints
};

// Helper functions
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

export const getApiEndpoint = (path: string): string => {
  return `${API_BASE_URL}/api/v1${path}`;
};
```

## Environment Variables

### Frontend Environment Variables

Create a `.env` file in the frontend directory:

```bash
# .env
REACT_APP_API_BASE_URL=https://stardust.evep.my-firstcare.com
REACT_APP_FRONTEND_URL=https://portal.evep.my-firstcare.com
REACT_APP_CDN_URL=https://cdn.evep.my-firstcare.com
REACT_APP_ADMIN_PANEL_URL=https://admin.evep.my-firstcare.com
REACT_APP_SOCKET_URL=https://socketio.evep.my-firstcare.com
```

### Backend Environment Variables

Create a `.env` file in the backend directory:

```bash
# .env
JWT_SECRET_KEY=your-jwt-secret-here
SECRET_KEY=your-secret-key-here
MONGO_ROOT_PASSWORD=your-mongo-password
REDIS_PASSWORD=your-redis-password
GRAFANA_PASSWORD=your-grafana-password
```

## Docker Configuration

### Docker Compose

**File**: `docker-compose.yml`

```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3013:3000"  # External:Internal
    environment:
      - NODE_ENV=production
    env_file:
      - .env

  backend:
    build: ./backend
    ports:
      - "8014:8000"  # External:Internal
    environment:
      - NODE_ENV=production
    env_file:
      - .env

  cdn:
    build: ./cdn
    ports:
      - "3014:3000"  # External:Internal

  admin-panel:
    build: ./admin-panel
    ports:
      - "3015:3000"  # External:Internal

  socketio:
    build: ./socketio
    ports:
      - "9014:9000"  # External:Internal
```

## Usage Examples

### 1. Using API Endpoints in Components

```typescript
import { API_ENDPOINTS } from '../config/constants';

// Login request
const loginUser = async (credentials) => {
  const response = await fetch(API_ENDPOINTS.LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  return response.json();
};
```

### 2. Using Helper Functions

```typescript
import { getApiEndpoint } from '../config/constants';

// Get specific endpoint
const studentsEndpoint = getApiEndpoint('/evep/students');
const response = await fetch(studentsEndpoint);
```

### 3. Dynamic URL Construction

```typescript
import { API_BASE_URL } from '../config/constants';

// Build custom endpoint
const customEndpoint = `${API_BASE_URL}/api/v1/custom/endpoint`;
const response = await fetch(customEndpoint);
```

## Deployment Process

### 1. Build and Deploy

```bash
# On production server
cd /www/dk_project/evep-my-firstcare-com

# Rebuild all services
docker-compose down
docker-compose up -d --build

# Or rebuild specific service
docker-compose up -d --build frontend
```

### 2. Verify Configuration

```bash
# Check running containers
docker ps

# Check frontend logs
docker logs evep-frontend

# Test API connectivity
curl -I https://stardust.evep.my-firstcare.com/api/v1/health
```

### 3. SSL Certificate Management

Ensure your reverse proxy has valid SSL certificates for all domains:

```bash
# Check SSL certificate
openssl s_client -connect portal.evep.my-firstcare.com:443 -servername portal.evep.my-firstcare.com

# Renew certificates (if using Let's Encrypt)
certbot renew
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend CORS configuration includes frontend domain
   - Check reverse proxy headers

2. **Connection Refused**
   - Verify Docker containers are running
   - Check port mappings in docker-compose.yml
   - Verify reverse proxy configuration

3. **SSL Issues**
   - Check SSL certificate validity
   - Verify reverse proxy SSL configuration
   - Check for mixed content (HTTP/HTTPS)

### Debug Commands

```bash
# Check container status
docker ps -a

# View container logs
docker logs <container-name>

# Test internal connectivity
docker exec -it <container-name> curl http://localhost:8014/api/v1/health

# Check network configuration
docker network ls
docker network inspect <network-name>
```

## Security Considerations

1. **Environment Variables**: Never commit secrets to version control
2. **SSL/TLS**: Always use HTTPS in production
3. **CORS**: Restrict CORS to necessary domains only
4. **Rate Limiting**: Implement rate limiting in reverse proxy
5. **Headers**: Use security headers (HSTS, CSP, etc.)

## Monitoring and Logging

### Health Checks

```bash
# Frontend health
curl -I https://portal.evep.my-firstcare.com

# Backend health
curl -I https://stardust.evep.my-firstcare.com/api/v1/health

# Admin panel health
curl -I https://admin.evep.my-firstcare.com
```

### Log Monitoring

```bash
# Real-time log monitoring
docker-compose logs -f

# Specific service logs
docker-compose logs -f frontend
docker-compose logs -f backend
```

## Conclusion

This configuration system provides:
- **Flexibility**: Easy switching between development and production
- **Scalability**: Reverse proxy can handle load balancing
- **Security**: SSL termination and proper isolation
- **Maintainability**: Centralized configuration management

For questions or issues, refer to the troubleshooting section or contact the development team.
