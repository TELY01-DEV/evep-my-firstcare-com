# EVEP Platform Quick Reference Guide

## 🚀 Quick Start

### System Access
- **Production URL**: https://portal.evep.my-firstcare.com
- **Admin Panel**: https://admin.evep.my-firstcare.com
- **API Base**: https://stardust.evep.my-firstcare.com

### Default Login Credentials
```
Super Admin:
Email: admin@evep.com
Password: EvepAdmin2025!

Medical Staff:
Email: doctor@evep.com
Password: EvepDoctor2025!
```

---

## 🔐 Authentication

### Login Process
1. Navigate to login page
2. Enter email and password
3. System generates JWT token
4. Token stored in browser localStorage
5. Auto-refresh on expiration

### API Authentication
```http
Authorization: Bearer <jwt_token>
```

---

## 👥 User Management vs 🏥 Medical Staff Management

| **Feature** | **User Management** | **Medical Staff** |
|-------------|-------------------|------------------|
| **Purpose** | System administration | Healthcare workforce |
| **URL** | `/dashboard/user-management` | `/dashboard/medical-staff` |
| **API** | `/api/v1/user-management` | `/api/v1/medical-staff-management` |
| **Focus** | Accounts & permissions | Credentials & training |

---

## 🎭 Roles & Permissions

### User Management Roles
```
super_admin     → Full system access
system_admin    → System administration  
medical_admin   → Medical system admin
doctor          → Medical practitioner
nurse           → Nursing staff
optometrist     → Eye care specialist
technician      → Technical support
coordinator     → Operations coordinator
assistant       → Administrative assistant
```

### Medical Staff Roles
```
doctor              → Medical doctor
nurse               → Registered nurse
medical_staff       → General medical staff
exclusive_hospital  → Hospital-specific staff
teacher             → School health staff
school_admin        → School health administrator
school_staff        → School health support
```

---

## 🔧 Common Operations

### Create New User
1. Navigate to **User Management** → **Management**
2. Click **"Create User"** button
3. Fill required fields:
   - Email (unique)
   - Password (min 8 chars)
   - First & Last Name
   - Role selection
4. Optional: Department, Phone
5. Click **"Create User"**

### Create Medical Staff
1. Navigate to **Medical Staff** → **Management**
2. Click **"Create Staff"** button
3. Fill required fields:
   - Email (unique)
   - Password (min 8 chars)
   - First & Last Name
   - Medical Role
   - Specialization
   - License Number
4. Optional: Department, Qualifications
5. Click **"Create Staff"**

### Upload Avatar
1. Open user/staff edit dialog
2. Click on avatar placeholder
3. Select image file (max 5MB)
4. Click **"Upload"**
5. System processes and saves image

### Change Password
1. Edit user in User Management
2. Enter new password in **"New Password"** field
3. Leave blank to keep current password
4. Click **"Update User"**

---

## 🔍 Search & Filtering

### User Management Filters
- **Search**: Name or email
- **Role**: Filter by user role
- **Status**: Active/Inactive users
- **Department**: Organizational unit

### Medical Staff Filters
- **Search**: Name, email, or license
- **Role**: Medical role type
- **Department**: Medical department
- **Specialization**: Medical specialty
- **Status**: Active/Inactive staff

---

## 📊 Statistics & Analytics

### User Management Stats
- Total users count
- Active vs inactive users
- Users by role distribution
- Recent login activity
- New registrations

### Medical Staff Stats
- Total staff count
- Staff by role/department
- Credential expiry alerts
- Training compliance status
- Workforce distribution

---

## 🚨 Troubleshooting

### Common Issues & Solutions

#### 1. Login Problems
```
Issue: "Invalid credentials"
Solution: 
- Check email format
- Verify password
- Clear browser cache
- Contact admin for password reset
```

#### 2. Permission Denied (403)
```
Issue: "Insufficient permissions"
Solution:
- Check user role assignment
- Verify required permissions
- Contact system administrator
- Review RBAC settings
```

#### 3. Avatar Upload Failed
```
Issue: "Mixed Content" or upload errors
Solution:
- Ensure file is under 5MB
- Use supported formats (JPG, PNG)
- Check internet connection
- Try different browser
```

#### 4. API Connection Refused
```
Issue: "ERR_CONNECTION_REFUSED"
Solution:
- Check API endpoint URL
- Verify authentication token
- Clear browser cache
- Restart browser
```

#### 5. Password Field Missing
```
Issue: Password field not visible in edit form
Solution:
- Refresh browser page
- Clear browser cache
- Check user permissions
- Use hard refresh (Ctrl+F5)
```

---

## 🔗 API Quick Reference

### Base Endpoints
```http
# User Management
GET    /api/v1/user-management/              # List users
POST   /api/v1/user-management/              # Create user
PUT    /api/v1/user-management/{id}          # Update user
DELETE /api/v1/user-management/{id}          # Deactivate user

# Medical Staff Management  
GET    /api/v1/medical-staff-management/     # List staff
POST   /api/v1/medical-staff-management/     # Create staff
PUT    /api/v1/medical-staff-management/{id} # Update staff
DELETE /api/v1/medical-staff-management/{id} # Remove staff

# File Upload
POST   /api/v1/cdn/upload                    # Upload files
PUT    /api/v1/auth/profile/avatar           # Update avatar
```

### Sample API Call
```bash
# Create user via API
curl -X POST "https://stardust.evep.my-firstcare.com/api/v1/user-management/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "new.user@evep.com",
    "password": "SecurePass123!",
    "first_name": "New",
    "last_name": "User",
    "role": "doctor"
  }'
```

---

## 🎯 Best Practices

### Security
- ✅ Use strong passwords (min 8 chars, mixed case, numbers)
- ✅ Regular password updates
- ✅ Principle of least privilege for roles
- ✅ Regular audit of user permissions
- ✅ Immediate deactivation of terminated staff

### Data Management
- ✅ Regular backup of user data
- ✅ Soft delete (deactivate) instead of hard delete
- ✅ Maintain audit logs for all changes
- ✅ Regular verification of staff credentials
- ✅ Keep contact information updated

### System Administration
- ✅ Monitor system usage statistics
- ✅ Regular review of inactive accounts
- ✅ Timely processing of access requests
- ✅ Documentation of role assignments
- ✅ Regular system health checks

---

## 📞 Support & Contact

### Technical Support
- **Email**: support@evep.my-firstcare.com
- **Documentation**: Available in `/docs` folder
- **API Reference**: See API_DOCUMENTATION.md
- **System Status**: Check Docker container health

### Emergency Contacts
- **System Administrator**: admin@evep.com
- **Medical Administrator**: medical-admin@evep.com
- **Technical Support**: tech-support@evep.com

### Useful Commands
```bash
# Check system status
docker ps | grep evep

# View logs
docker logs evep-frontend
docker logs evep-backend
docker logs evep-stardust

# Restart services
docker-compose restart frontend
docker-compose restart backend
```

---

## 📚 Additional Resources

### Documentation Files
- `USER_MANAGEMENT_VS_MEDICAL_STAFF_MANAGEMENT.md` - Detailed comparison
- `API_DOCUMENTATION.md` - Complete API reference
- `DEPLOYMENT_GUIDE.md` - System deployment instructions
- `SECURITY_GUIDELINES.md` - Security best practices

### Training Materials
- User Management Training Videos
- Medical Staff Onboarding Guide
- API Integration Examples
- System Administration Manual

### Version Information
- **Platform Version**: 1.2.0
- **API Version**: v1
- **Last Updated**: January 3, 2025
- **Next Update**: Quarterly security patches



