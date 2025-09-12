# 🚀 Quick Reference Card

## 🌐 Domain Mapping

| Service | External Domain | Internal Port | Description |
|---------|----------------|---------------|-------------|
| **Frontend** | `https://portal.evep.my-firstcare.com` | `localhost:3013` | Main application |
| **Backend API** | `https://stardust.evep.my-firstcare.com` | `localhost:8014` | REST API |
| **Admin Panel** | `https://admin.evep.my-firstcare.com` | `localhost:3015` | Admin interface |
| **CDN** | `https://cdn.evep.my-firstcare.com` | `localhost:3014` | Static files |
| **Socket.IO** | `https://socketio.evep.my-firstcare.com` | `localhost:9014` | Real-time |

## 🔧 Quick Commands

### Check Status
```bash
docker ps                    # Running containers
docker-compose logs -f      # Live logs
docker-compose ps           # Service status
```

### Rebuild Services
```bash
docker-compose up -d --build frontend    # Frontend only
docker-compose up -d --build backend     # Backend only
docker-compose up -d --build             # All services
```

### Health Checks
```bash
curl -I https://portal.evep.my-firstcare.com           # Frontend
curl -I https://stardust.evep.my-firstcare.com/api/v1/health  # Backend
curl -I https://admin.evep.my-firstcare.com            # Admin
```

## 📁 Key Files

- **API Config**: `frontend/src/config/api.ts`
- **Constants**: `frontend/src/config/constants.ts`
- **Docker Compose**: `docker-compose.yml`
- **Environment**: `.env`

## 🚨 Troubleshooting

### Connection Refused
```bash
# Check if containers are running
docker ps

# Check specific service logs
docker logs evep-frontend
docker logs evep-backend

# Test internal connectivity
docker exec -it evep-frontend curl http://localhost:8014/api/v1/health
```

### CORS Issues
- Verify backend CORS includes frontend domain
- Check reverse proxy headers
- Ensure SSL certificates are valid

### SSL Problems
```bash
# Check certificate
openssl s_client -connect portal.evep.my-firstcare.com:443

# Renew (Let's Encrypt)
certbot renew
```

## 🔄 Environment Variables

### Frontend (.env)
```bash
REACT_APP_API_BASE_URL=https://stardust.evep.my-firstcare.com
REACT_APP_FRONTEND_URL=https://portal.evep.my-firstcare.com
REACT_APP_CDN_URL=https://cdn.evep.my-firstcare.com
REACT_APP_ADMIN_PANEL_URL=https://admin.evep.my-firstcare.com
REACT_APP_SOCKET_URL=https://socketio.evep.my-firstcare.com
```

### Backend (.env)
```bash
JWT_SECRET_KEY=your-jwt-secret
SECRET_KEY=your-secret-key
MONGO_ROOT_PASSWORD=your-mongo-password
REDIS_PASSWORD=your-redis-password
GRAFANA_PASSWORD=your-grafana-password
```

## 📱 Access URLs

### Development (Local)
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8014`
- Admin: `http://localhost:3015`

### Production (External)
- Frontend: `https://portal.evep.my-firstcare.com`
- Backend: `https://stardust.evep.my-firstcare.com`
- Admin: `https://admin.evep.my-firstcare.com`

## 🆘 Emergency Commands

### Stop All Services
```bash
docker-compose down
```

### Force Rebuild
```bash
docker-compose down
docker system prune -f
docker-compose up -d --build
```

### Check Logs
```bash
docker-compose logs --tail=100 frontend
docker-compose logs --tail=100 backend
```

---

**📖 Full Documentation**: See `docs/API_CONFIGURATION.md`
**🐛 Issues**: Check troubleshooting section
**📞 Support**: Contact development team



