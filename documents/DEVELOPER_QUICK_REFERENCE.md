# 🚀 **EVEP Platform - Developer Quick Reference**

## 📋 **Quick Permissions Matrix**

| Action | Admin | Doctor | Medical Staff | Teacher | Parent | Student |
|--------|-------|--------|---------------|---------|--------|---------|
| **Create Patients** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **View Patients** | ✅ | ✅ | ✅ | ❌ | ✅ (own) | ❌ |
| **Update Patients** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Create School Screenings** | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Create Medical Screenings** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **View School Screenings** | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **View Medical Screenings** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Register Students as Patients** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 🔧 **API Quick Reference**

### **Authentication**
```bash
# Login
curl -X POST http://localhost:8013/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Use token in subsequent requests
curl -X GET http://localhost:8013/api/v1/auth/profile \
  -H "Authorization: Bearer <token>"
```

### **Patient Management**
```bash
# Create patient (Admin/Doctor/Medical Staff only)
curl -X POST http://localhost:8013/api/v1/patients \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "2010-01-01",
    "gender": "male",
    "parent_email": "parent@example.com",
    "parent_phone": "0812345678",
    "emergency_contact": "Emergency Contact",
    "emergency_phone": "0812345678",
    "address": "123 Main St"
  }'

# Get patients (filtered by role)
curl -X GET http://localhost:8013/api/v1/patients \
  -H "Authorization: Bearer <token>"

# Register student as patient
curl -X POST http://localhost:8013/api/v1/patients/from-student/{student_id} \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "emergency_contact": "Emergency Contact",
    "emergency_phone": "0812345678"
  }'
```

### **Screening Management**
```bash
# Create school screening (Teacher/Admin only)
curl -X POST http://localhost:8013/api/v1/screenings/sessions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "ObjectId",
    "examiner_id": "ObjectId",
    "screening_type": "distance",
    "screening_category": "school_screening",
    "equipment_used": "Snellen Chart",
    "notes": "Basic vision screening"
  }'

# Create medical screening (Doctor/Admin only)
curl -X POST http://localhost:8013/api/v1/screenings/sessions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "ObjectId",
    "examiner_id": "ObjectId",
    "screening_type": "comprehensive",
    "screening_category": "medical_screening",
    "equipment_used": "Advanced Medical Equipment",
    "notes": "Professional medical assessment"
  }'

# Get screening sessions (filtered by role)
curl -X GET http://localhost:8013/api/v1/screenings/sessions \
  -H "Authorization: Bearer <token>"

# Get screening analytics
curl -X GET http://localhost:8013/api/v1/screenings/analytics/patient/{patient_id} \
  -H "Authorization: Bearer <token>"
```

---

## 🎯 **Role-Based Development Guidelines**

### **For Teacher Features**
```javascript
// Frontend: Check if user can create school screenings
if (user.role === 'teacher' || user.role === 'admin') {
  // Show school screening creation form
}

// Backend: Validate screening category
if (user.role === 'teacher' && screening_category !== 'school_screening') {
  throw new HTTPException(400, "Teachers can only create school screenings")
}
```

### **For Doctor Features**
```javascript
// Frontend: Check if user can create medical screenings
if (user.role === 'doctor' || user.role === 'admin') {
  // Show medical screening creation form
}

// Backend: Validate screening category
if (user.role === 'doctor' && screening_category !== 'medical_screening') {
  throw new HTTPException(400, "Doctors can only create medical screenings")
}
```

### **For Parent Features**
```javascript
// Frontend: Filter patients by parent email
const parentPatients = patients.filter(p => p.parent_email === user.email)

// Backend: Ensure parent can only access their children
if (user.role === 'parent' && patient.parent_email !== user.email) {
  throw new HTTPException(403, "Access denied")
}
```

---

## 🔍 **Common Patterns**

### **Permission Checking**
```python
# Standard permission check pattern
def check_patient_permissions(current_user: dict, action: str):
    if action == "create":
        if current_user["role"] not in ["doctor", "admin", "medical_staff"]:
            raise HTTPException(403, "Insufficient permissions")
    elif action == "view":
        if current_user["role"] not in ["doctor", "parent", "admin", "medical_staff"]:
            raise HTTPException(403, "Insufficient permissions")
```

### **Role-Based Filtering**
```python
# Filter data based on user role
def get_filtered_data(current_user: dict, base_query: dict):
    if current_user["role"] == "teacher":
        base_query["screening_category"] = "school_screening"
    elif current_user["role"] == "doctor":
        base_query["screening_category"] = "medical_screening"
    elif current_user["role"] == "parent":
        base_query["parent_email"] = current_user["email"]
    
    return base_query
```

### **Audit Logging**
```python
# Standard audit logging pattern
async def log_action(action: str, user_id: str, details: dict):
    audit_log = {
        "action": action,
        "user_id": user_id,
        "timestamp": datetime.utcnow(),
        "audit_hash": generate_blockchain_hash(f"{action}:{user_id}"),
        "details": details
    }
    await db.audit_logs.insert_one(audit_log)
```

---

## 🚨 **Common Issues & Solutions**

### **403 Forbidden Errors**
```bash
# Check user role
curl -X GET http://localhost:8013/api/v1/auth/profile \
  -H "Authorization: Bearer <token>"

# Verify endpoint permissions in documentation
```

### **Screening Category Errors**
```bash
# Teachers must use school_screening
# Doctors must use medical_screening
# Admins can use either
```

### **Parent Access Issues**
```bash
# Ensure parent_email matches user email
# Check if patient exists and is active
```

---

## 📊 **Testing Commands**

### **Test Different User Roles**
```bash
# Test as Admin
curl -X POST http://localhost:8013/api/v1/patients \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{...}'

# Test as Doctor
curl -X POST http://localhost:8013/api/v1/patients \
  -H "Authorization: Bearer <doctor_token>" \
  -H "Content-Type: application/json" \
  -d '{...}'

# Test as Teacher (should fail for patient creation)
curl -X POST http://localhost:8013/api/v1/patients \
  -H "Authorization: Bearer <teacher_token>" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### **Test Screening Categories**
```bash
# Test school screening (Teacher/Admin)
curl -X POST http://localhost:8013/api/v1/screenings/sessions \
  -H "Authorization: Bearer <teacher_token>" \
  -H "Content-Type: application/json" \
  -d '{"screening_category": "school_screening", ...}'

# Test medical screening (Doctor/Admin)
curl -X POST http://localhost:8013/api/v1/screenings/sessions \
  -H "Authorization: Bearer <doctor_token>" \
  -H "Content-Type: application/json" \
  -d '{"screening_category": "medical_screening", ...}'
```

---

## 🔗 **Useful Links**

- **Full Documentation**: `documents/EVEP_PERMISSIONS_AND_SCREENING_DOCUMENTATION.md`
- **Permissions Summary**: `documents/PERMISSIONS_SUMMARY.md`
- **API Documentation**: `http://localhost:8013/docs`
- **GitHub Repository**: [EVEP Platform](https://github.com/evep-platform)

---

**Quick Reference Version**: 1.0  
**Last Updated**: January 2025
