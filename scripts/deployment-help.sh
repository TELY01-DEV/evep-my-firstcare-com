#!/bin/bash

# EVEP Deployment - Quick Reference
# Save this for quick access

cat << 'EOF'

╔════════════════════════════════════════════════════════════╗
║           EVEP DEPLOYMENT QUICK REFERENCE                  ║
╚════════════════════════════════════════════════════════════╝

📦 DEPLOY COMMANDS
──────────────────────────────────────────────────────────────
  ./deploy.sh all         Deploy everything (5-7 min)
  ./deploy.sh backend     Deploy backend only (~15 sec)
  ./deploy.sh frontend    Deploy frontend portal (2-3 min)
  ./deploy.sh admin       Deploy admin panel (2-3 min)

🔍 CHECK STATUS ON SERVER
──────────────────────────────────────────────────────────────
  ssh -p 2222 root@103.22.182.146 "docker ps"
  ssh -p 2222 root@103.22.182.146 "docker logs evep-stardust --tail 50"
  ssh -p 2222 root@103.22.182.146 "docker logs evep-frontend --tail 50"
  ssh -p 2222 root@103.22.182.146 "docker logs evep-admin-panel --tail 50"

🌐 SERVICE URLS
──────────────────────────────────────────────────────────────
  Portal:      https://portal.evep.my-firstcare.com
  Admin:       https://admin.evep.my-firstcare.com
  API:         https://stardust.evep.my-firstcare.com
  API Docs:    https://stardust.evep.my-firstcare.com/docs
  Health:      https://stardust.evep.my-firstcare.com/health

📂 WHAT GETS DEPLOYED
──────────────────────────────────────────────────────────────
  Backend:    backend/app/*.py → /www/dk_project/.../backend/app/
  Frontend:   frontend/build/* → /www/dk_project/.../frontend/build/
  Admin:      admin-panel/build/* → /www/dk_project/.../admin-panel/build/

⚡ TYPICAL WORKFLOW
──────────────────────────────────────────────────────────────
  1. Edit files locally (backend/*.py or frontend/src/*.tsx)
  2. Test locally (npm start or uvicorn app.main:app)
  3. Run deployment script (./deploy.sh [component])
  4. Check logs and verify on production URL
  5. Clear browser cache if frontend/admin changes

🔄 ROLLBACK
──────────────────────────────────────────────────────────────
  Backups are in: /www/dk_project/evep-my-firstcare-com/backups/
  
  ssh -p 2222 root@103.22.182.146
  cd /www/dk_project/evep-my-firstcare-com
  ls -lh backups/
  cd backend && tar -xzf ../backups/backend_YYYYMMDD_HHMMSS.tar.gz
  docker-compose restart evep-stardust

🐛 TROUBLESHOOTING
──────────────────────────────────────────────────────────────
  Build fails:          cd frontend && rm -rf build && npm run build
  SSH fails:            ssh -p 2222 root@103.22.182.146
  Container not up:     docker ps | grep evep
  Check disk space:     df -h
  Restart all:          docker-compose restart

💡 TIPS
──────────────────────────────────────────────────────────────
  • Run from project root directory
  • Clear browser cache after UI changes
  • Check build size: du -sh frontend/build
  • Monitor live logs: docker logs -f evep-stardust
  • Deploy only what changed to save time

EOF
