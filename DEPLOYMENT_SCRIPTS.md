# EVEP Deployment Scripts

> Build locally, deploy to production - No source code or heavy builds on server

## 📋 Overview

These deployment scripts allow you to:
- ✅ Build React applications **locally** on your development machine
- ✅ Transfer **only built files** (no source code or node_modules)
- ✅ Deploy backend Python code without rebuilding Docker images
- ✅ Fast deployment with automatic container restart
- ✅ Automatic backups before each deployment
- ✅ Health checks after deployment

## 🚀 Quick Start

### Deploy Everything
```bash
./deploy.sh all
```

### Deploy Individual Components

**Backend Only** (Python/FastAPI):
```bash
./deploy.sh backend
```

**Frontend Portal Only** (React):
```bash
./deploy.sh frontend
```

**Admin Panel Only** (React):
```bash
./deploy.sh admin
```

## 📦 What Gets Deployed

### Backend Deployment
- **Transfers**: Python files from `backend/app/`
- **Excludes**: `__pycache__`, `*.pyc`, `venv`, logs
- **Action**: Restarts `evep-stardust` container
- **No Build**: Uses existing Docker image

### Frontend Deployment
- **Builds Locally**: Runs `npm run build` in `frontend/`
- **Transfers**: Only `build/` directory contents
- **Action**: Restarts `evep-frontend` container
- **Size**: ~2-5 MB (vs ~500 MB source)

### Admin Panel Deployment
- **Builds Locally**: Runs `npm run build` in `admin-panel/`
- **Transfers**: Only `build/` directory contents
- **Action**: Restarts `evep-admin-panel` container
- **Size**: ~2-5 MB (vs ~500 MB source)

## 🔧 Prerequisites

### Required Tools
- `ssh` - SSH client
- `scp` - Secure copy
- `rsync` - File synchronization
- `node` & `npm` - For building React apps (frontend/admin only)

### SSH Access
Ensure you have SSH access configured:
```bash
# Test connection
ssh -p 2222 root@103.22.182.146 "echo 'Connected'"
```

## 📂 Directory Structure

```
evep-my-firstcare-com/
├── deploy.sh                      # Master deployment script
├── scripts/
│   ├── deploy-backend.sh         # Backend deployment
│   ├── deploy-frontend.sh        # Frontend deployment
│   └── deploy-admin.sh           # Admin panel deployment
├── backend/
│   └── app/                      # Python code (deployed)
├── frontend/
│   ├── src/                      # Source (NOT deployed)
│   └── build/                    # Built files (deployed)
└── admin-panel/
    ├── src/                      # Source (NOT deployed)
    └── build/                    # Built files (deployed)
```

## 🎯 Deployment Flow

### Backend Flow
```
1. Create backup on server
2. Transfer Python files via rsync
3. Restart evep-stardust container
4. Health check (http://localhost:8013/health)
5. Show logs
```

### Frontend/Admin Flow
```
1. Install dependencies (if needed)
2. Build React app locally (npm run build)
3. Create backup on server
4. Transfer build/ directory via rsync
5. Restart container
6. Health check
7. Show container status
```

## ⚙️ Configuration

All scripts use these settings:
```bash
SERVER_HOST="103.22.182.146"
SERVER_PORT="2222"
SERVER_USER="root"
REMOTE_PATH="/www/dk_project/evep-my-firstcare-com"
```

To change server details, edit the scripts in `scripts/` directory.

## 🔍 What Happens During Deployment

### Automatic Backups
Before each deployment, a timestamped backup is created:
```
backend/backups/backend_20241120_143022.tar.gz
backend/backups/frontend_build_20241120_143022.tar.gz
backend/backups/admin_build_20241120_143022.tar.gz
```

### Health Checks
- Backend: Checks `/health` endpoint
- Frontend: Checks HTTP 200 response
- Admin: Checks HTTP 200 response
- Retries: 10 attempts with 3-second intervals

### Container Restart
```bash
docker-compose restart evep-stardust      # Backend
docker-compose restart evep-frontend      # Frontend
docker-compose restart evep-admin-panel   # Admin
```

## 📊 Deployment Time

| Component | Build Time | Transfer Time | Total Time |
|-----------|-----------|---------------|------------|
| Backend | N/A | ~5 seconds | ~15 seconds |
| Frontend | 1-2 minutes | ~10 seconds | 2-3 minutes |
| Admin Panel | 1-2 minutes | ~10 seconds | 2-3 minutes |
| **All** | 2-4 minutes | ~25 seconds | **5-7 minutes** |

## 🐛 Troubleshooting

### Build Fails
```bash
# Clean and rebuild
cd frontend
rm -rf node_modules build
npm install
npm run build
```

### SSH Connection Failed
```bash
# Test connection
ssh -p 2222 root@103.22.182.146

# Check SSH key
ls -la ~/.ssh/
```

### Container Not Starting
```bash
# SSH to server and check logs
ssh -p 2222 root@103.22.182.146
cd /www/dk_project/evep-my-firstcare-com
docker-compose logs evep-stardust --tail 50
```

### Health Check Failed
```bash
# Check container status
ssh -p 2222 root@103.22.182.146 "docker ps | grep evep"

# Check specific logs
ssh -p 2222 root@103.22.182.146 "docker logs evep-stardust --tail 100"
```

## 🔒 Security Notes

- Scripts use SSH key authentication (not passwords)
- Only built files are transferred (no .env or secrets)
- Backups are created automatically before each deployment
- Source code remains on local machine only

## 📝 Examples

### Deploy after backend code changes:
```bash
# Edit Python files in backend/app/
./deploy.sh backend
# Wait ~15 seconds, done!
```

### Deploy after frontend UI changes:
```bash
# Edit React components in frontend/src/
./deploy.sh frontend
# Builds locally, transfers ~3MB, done in 2-3 minutes
```

### Deploy everything after major changes:
```bash
./deploy.sh all
# Deploys backend + frontend + admin
# Takes ~5-7 minutes total
```

### Check what will be deployed (dry run):
```bash
# Backend
rsync -avz --dry-run --exclude='__pycache__' backend/app/ user@server:/path/

# Frontend (after building)
cd frontend && npm run build
rsync -avz --dry-run build/ user@server:/path/
```

## 🎨 Script Features

- ✅ **Color-coded output**: Blue (info), Green (success), Yellow (warning), Red (error)
- ✅ **Progress indicators**: Shows each step clearly
- ✅ **Automatic backups**: No data loss risk
- ✅ **Health checks**: Ensures deployment worked
- ✅ **Error handling**: Exits on any error with clear message
- ✅ **Timestamps**: All logs have timestamps
- ✅ **Rollback ready**: Backups available for quick rollback

## 🔄 Rollback

If deployment fails, rollback using backup:
```bash
ssh -p 2222 root@103.22.182.146

# List backups
ls -lh /www/dk_project/evep-my-firstcare-com/backups/

# Rollback backend
cd /www/dk_project/evep-my-firstcare-com/backend
tar -xzf ../backups/backend_20241120_143022.tar.gz

# Rollback frontend
cd /www/dk_project/evep-my-firstcare-com/frontend
tar -xzf ../backups/frontend_build_20241120_143022.tar.gz

# Restart containers
cd /www/dk_project/evep-my-firstcare-com
docker-compose restart evep-stardust evep-frontend evep-admin-panel
```

## 📱 Service URLs After Deployment

- **Frontend Portal**: https://portal.evep.my-firstcare.com
- **Admin Panel**: https://admin.evep.my-firstcare.com
- **API Backend**: https://stardust.evep.my-firstcare.com
- **API Documentation**: https://stardust.evep.my-firstcare.com/docs
- **Health Check**: https://stardust.evep.my-firstcare.com/health

## 💡 Tips

1. **Clear browser cache** after frontend/admin deployment if changes don't appear
2. **Run from project root** - all scripts expect to be run from project root
3. **Check build size** - Frontend builds should be 2-5 MB
4. **Monitor logs** - Use `docker logs -f container_name` to watch live logs
5. **Use `all` sparingly** - Only deploy what changed to save time

## 🆘 Support

If deployment fails:
1. Check error message in red
2. Look at recent container logs
3. Verify SSH connection
4. Check server disk space
5. Review backup files

## 📄 License

Part of the EVEP Medical Portal System
