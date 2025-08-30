# EVEP Platform - MongoDB-Based Settings System

## 🔧 **Overview**

The EVEP Platform now uses a **hybrid configuration approach** that combines:
- **Environment Variables** (`.env`) - For sensitive/static configuration
- **MongoDB Collections** - For dynamic/runtime configuration

This provides maximum flexibility while maintaining security best practices.

---

## 🏗️ **Architecture**

### **Configuration Layers**

```
┌─────────────────────────────────────┐
│           Application               │
├─────────────────────────────────────┤
│      MongoDB Settings Manager       │ ← Dynamic Settings
├─────────────────────────────────────┤
│      Environment Variables          │ ← Static/Sensitive
├─────────────────────────────────────┤
│         System Defaults             │ ← Fallback Values
└─────────────────────────────────────┘
```

### **What Goes Where**

#### **🔐 Environment Variables (.env)**
- Database connection strings
- API keys and secrets
- JWT secrets
- Service passwords
- Environment-specific configs

#### **🗄️ MongoDB Settings**
- User preferences
- System configuration
- Feature flags
- Business rules
- Dynamic settings

---

## 📊 **Settings Categories**

### **1. System Settings**
```json
{
  "system.maintenance_mode": false,
  "system.debug_mode": true,
  "system.timezone": "Asia/Bangkok"
}
```

### **2. User Management**
```json
{
  "user.registration_enabled": true,
  "user.email_verification_required": true,
  "user.max_login_attempts": 5,
  "user.lockout_duration_minutes": 30
}
```

### **3. Security Settings**
```json
{
  "security.password_min_length": 8,
  "security.password_require_special": true,
  "security.session_timeout_hours": 24,
  "security.rate_limit_requests": 100
}
```

### **4. Email Configuration**
```json
{
  "email.smtp_host": "smtp.gmail.com",
  "email.smtp_port": 587,
  "email.from_address": "noreply@evep.my-firstcare.com",
  "email.from_name": "EVEP Platform"
}
```

### **5. Notification Settings**
```json
{
  "notification.email_enabled": true,
  "notification.sms_enabled": false,
  "notification.push_enabled": false
}
```

### **6. Storage Settings**
```json
{
  "storage.max_file_size_mb": 10,
  "storage.allowed_file_types": ["jpg", "jpeg", "png", "pdf", "doc", "docx"],
  "storage.auto_cleanup_days": 30
}
```

### **7. Analytics Settings**
```json
{
  "analytics.enabled": true,
  "analytics.retention_days": 365,
  "analytics.privacy_mode": false
}
```

---

## 🔧 **Technical Implementation**

### **Settings Manager Class**
```python
class SettingsManager:
    def __init__(self):
        self.collection_name = "system_settings"
        self.cache = {}
        self.cache_ttl = 300  # 5 minutes cache
    
    async def get_setting(self, key: str, default: Any = None) -> Any
    async def set_setting(self, key: str, value: Any, category: str, description: str) -> bool
    async def delete_setting(self, key: str) -> bool
    async def get_settings_by_category(self, category: str) -> Dict[str, Any]
    async def get_all_settings(self) -> Dict[str, Any]
    async def initialize_default_settings(self)
    async def get_combined_config(self) -> Dict[str, Any]
```

### **Database Schema**
```javascript
{
  "_id": ObjectId,
  "key": "system.maintenance_mode",
  "value": false,
  "category": "system",
  "description": "Enable/disable maintenance mode",
  "updated_at": ISODate,
  "updated_by": "system"
}
```

### **Caching Strategy**
- **In-Memory Cache**: 5-minute TTL for performance
- **Cache Invalidation**: Automatic on setting updates
- **Fallback**: Environment variables if MongoDB unavailable

---

## 🌐 **API Endpoints**

### **Settings Management API**
```
GET    /api/v1/admin/settings              # Get all settings
GET    /api/v1/admin/settings/{category}    # Get settings by category
GET    /api/v1/admin/settings/key/{key}     # Get specific setting
POST   /api/v1/admin/settings              # Create new setting
PUT    /api/v1/admin/settings/{key}        # Update setting
DELETE /api/v1/admin/settings/{key}        # Delete setting
POST   /api/v1/admin/settings/initialize   # Initialize default settings
GET    /api/v1/admin/settings/config/combined  # Get combined config
GET    /api/v1/admin/settings/categories   # Get all categories
```

### **Example API Usage**
```bash
# Get all settings
curl -X GET http://localhost:8013/api/v1/admin/settings \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update a setting
curl -X PUT http://localhost:8013/api/v1/admin/settings/system.maintenance_mode \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": true, "description": "Enable maintenance mode"}'

# Get settings by category
curl -X GET http://localhost:8013/api/v1/admin/settings/security \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🚀 **Usage Examples**

### **1. Getting Settings in Code**
```python
from app.core.settings_manager import settings_manager

# Get a specific setting
maintenance_mode = await settings_manager.get_setting("system.maintenance_mode", default=False)

# Get all security settings
security_settings = await settings_manager.get_settings_by_category("security")

# Get combined configuration
config = await settings_manager.get_combined_config()
```

### **2. Updating Settings**
```python
# Update a setting
success = await settings_manager.set_setting(
    key="user.max_login_attempts",
    value=10,
    category="user",
    description="Maximum failed login attempts"
)
```

### **3. Using Settings in Application**
```python
# In your application code
async def check_maintenance_mode():
    is_maintenance = await settings_manager.get_setting("system.maintenance_mode", False)
    if is_maintenance:
        raise HTTPException(status_code=503, detail="System under maintenance")

async def validate_password(password: str):
    min_length = await settings_manager.get_setting("security.password_min_length", 8)
    if len(password) < min_length:
        raise ValueError(f"Password must be at least {min_length} characters")
```

---

## 🔄 **Migration Strategy**

### **From Environment-Only to Hybrid**

#### **Phase 1: Setup**
1. ✅ Create SettingsManager class
2. ✅ Implement MongoDB storage
3. ✅ Add caching layer
4. ✅ Create API endpoints

#### **Phase 2: Migration**
1. **Identify Settings**: Categorize existing environment variables
2. **Move Dynamic Settings**: Transfer non-sensitive settings to MongoDB
3. **Update Code**: Replace hardcoded values with settings manager calls
4. **Test**: Verify all functionality works with new system

#### **Phase 3: Optimization**
1. **Performance Tuning**: Optimize cache settings
2. **Monitoring**: Add metrics and logging
3. **Backup**: Implement settings backup/restore
4. **Validation**: Add setting validation rules

---

## 📈 **Benefits**

### **1. Dynamic Configuration**
- ✅ Change settings without code deployment
- ✅ Feature flags and A/B testing
- ✅ Environment-specific configurations
- ✅ User-specific preferences

### **2. Security**
- ✅ Sensitive data stays in environment variables
- ✅ Role-based access control for settings
- ✅ Audit trail for all changes
- ✅ Secure API endpoints

### **3. Performance**
- ✅ In-memory caching for fast access
- ✅ Minimal database queries
- ✅ Fallback to environment variables
- ✅ Optimized for read-heavy workloads

### **4. Maintainability**
- ✅ Centralized configuration management
- ✅ Version control for settings
- ✅ Easy backup and restore
- ✅ Clear separation of concerns

---

## 🛡️ **Security Considerations**

### **Access Control**
- **Admin Only**: Settings management requires admin privileges
- **Super Admin**: Some settings require super admin access
- **Audit Logging**: All changes are logged with user information
- **Validation**: Input validation for all setting values

### **Data Protection**
- **Sensitive Data**: Never stored in MongoDB
- **Encryption**: Consider encrypting sensitive settings
- **Backup Security**: Secure backup and restore procedures
- **Access Logs**: Monitor who accesses settings

---

## 📊 **Monitoring & Maintenance**

### **Health Checks**
```python
async def check_settings_health():
    try:
        # Test database connection
        await settings_manager.get_setting("system.health_check")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
```

### **Backup Strategy**
```bash
# Backup settings
mongodump --collection=system_settings --db=evep

# Restore settings
mongorestore --collection=system_settings --db=evep
```

### **Performance Monitoring**
- Cache hit/miss ratios
- Database query performance
- API response times
- Memory usage

---

## 🎯 **Next Steps**

### **Immediate**
1. ✅ **Settings System**: Implemented and tested
2. ✅ **API Endpoints**: Created and functional
3. ✅ **Default Settings**: Initialized with 24 settings
4. ✅ **Access Control**: Role-based permissions working

### **Short Term**
1. **Frontend Integration**: Create settings management UI
2. **Validation Rules**: Add setting value validation
3. **Backup System**: Implement automated backups
4. **Monitoring**: Add performance metrics

### **Long Term**
1. **Advanced Features**: Setting dependencies and inheritance
2. **Multi-Environment**: Environment-specific settings
3. **Import/Export**: Settings migration tools
4. **Advanced Caching**: Redis-based distributed caching

---

## 📝 **Configuration Summary**

### **Current Status**
- ✅ **24 Default Settings**: Initialized in MongoDB
- ✅ **7 Categories**: System, User, Security, Email, Notification, Storage, Analytics
- ✅ **API Endpoints**: Full CRUD operations available
- ✅ **Access Control**: Admin and Super Admin permissions
- ✅ **Caching**: 5-minute in-memory cache
- ✅ **Fallback**: Environment variable support

### **Access Information**
```
Settings API: http://localhost:8013/api/v1/admin/settings
Admin Panel:  http://localhost:3015/admin/settings
Database:     MongoDB collection 'system_settings'
Cache TTL:    5 minutes
```

---

**🔧 The EVEP Platform now has a robust, flexible MongoDB-based settings system that provides dynamic configuration management while maintaining security best practices!**



