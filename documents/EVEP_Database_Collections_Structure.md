# EVEP Platform - Database Collections Structure

## 🎯 **Overview**

The EVEP Platform uses a well-organized MongoDB database structure with separate collections for different user types and data categories. This provides clear separation of concerns, better data management, and enhanced security.

---

## 🗄️ **Database Collections**

### **👥 User Management Collections**

#### **1. `users` Collection**
**Purpose**: General users of the platform
**User Types**:
- **Teachers**: School teachers who conduct vision screenings
- **Parents**: Parents of students/patients
- **General Users**: Other platform users

**Document Structure**:
```json
{
  "_id": "ObjectId",
  "email": "teacher@school.com",
  "name": "John Doe",
  "role": "teacher",
  "password_hash": "bcrypt_hash",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "last_login": "2024-01-15T10:30:00Z",
  "profile": {
    "phone": "+1234567890",
    "school": "ABC School",
    "grade": "5th Grade"
  }
}
```

#### **2. `admin_users` Collection**
**Purpose**: Admin panel users only
**User Types**:
- **Admin**: System administrators
- **Super Admin**: Super administrators with full access

**Document Structure**:
```json
{
  "_id": "ObjectId",
  "email": "admin@evep.com",
  "name": "System Administrator",
  "role": "admin",
  "password_hash": "bcrypt_hash",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "last_login": "2024-01-15T10:30:00Z",
  "permissions": ["user_management", "system_settings"],
  "profile": {
    "phone": "+1234567890",
    "department": "IT"
  }
}
```

#### **3. `medical_staff_users` Collection**
**Purpose**: Medical portal users only
**User Types**:
- **Doctors**: Medical professionals with full access
- **Nurses**: Medical staff with patient management access
- **Medical Staff**: Support staff with limited access
- **Exclusive Hospital**: Hospital-specific users with specialized access

**Document Structure**:
```json
{
  "_id": "ObjectId",
  "email": "doctor@hospital.com",
  "name": "Dr. Jane Smith",
  "role": "doctor",
  "password_hash": "bcrypt_hash",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "last_login": "2024-01-15T10:30:00Z",
  "medical_license": "MD123456",
  "specialization": "Ophthalmology",
  "hospital": "City General Hospital",
  "profile": {
    "phone": "+1234567890",
    "department": "Eye Care",
    "experience_years": 10
  }
}
```

### **📊 Data Collections**

#### **4. `patients` Collection**
**Purpose**: Patient records and information
**Access**: Medical staff users, teachers (limited)

**Document Structure**:
```json
{
  "_id": "ObjectId",
  "patient_id": "P001234",
  "name": "Alice Johnson",
  "date_of_birth": "2010-05-15",
  "gender": "female",
  "contact_info": {
    "phone": "+1234567890",
    "email": "parent@email.com",
    "address": "123 Main St, City"
  },
  "medical_history": {
    "previous_conditions": ["Astigmatism"],
    "medications": [],
    "allergies": []
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "created_by": "ObjectId(teacher_id)",
  "assigned_doctor": "ObjectId(doctor_id)"
}
```

#### **5. `screenings` Collection**
**Purpose**: General vision screening data
**Access**: Medical staff users, teachers (create only)

**Document Structure**:
```json
{
  "_id": "ObjectId",
  "screening_id": "S001234",
  "patient_id": "ObjectId(patient_id)",
  "conducted_by": "ObjectId(medical_staff_id)",
  "screening_date": "2024-01-15T10:30:00Z",
  "screening_type": "comprehensive",
  "results": {
    "left_eye": {
      "visual_acuity": "20/20",
      "pressure": 14,
      "notes": "Normal"
    },
    "right_eye": {
      "visual_acuity": "20/25",
      "pressure": 15,
      "notes": "Slight myopia"
    }
  },
  "recommendations": "Follow up in 6 months",
  "status": "completed",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### **6. `school_screenings` Collection**
**Purpose**: Vision screening data conducted by teachers
**Access**: Teachers (create/read), medical staff (read)

**Document Structure**:
```json
{
  "_id": "ObjectId",
  "screening_id": "SS001234",
  "patient_id": "ObjectId(patient_id)",
  "conducted_by": "ObjectId(teacher_id)",
  "school": "ABC School",
  "grade": "5th Grade",
  "screening_date": "2024-01-15T10:30:00Z",
  "screening_type": "basic_school",
  "results": {
    "left_eye": {
      "visual_acuity": "20/30",
      "notes": "May need glasses"
    },
    "right_eye": {
      "visual_acuity": "20/25",
      "notes": "Normal"
    }
  },
  "referral_needed": true,
  "referral_notes": "Student shows signs of myopia",
  "status": "pending_review",
  "reviewed_by": "ObjectId(medical_staff_id)",
  "review_date": "2024-01-16T10:30:00Z",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-16T10:30:00Z"
}
```

### **⚙️ System Collections**

#### **7. `system_settings` Collection**
**Purpose**: Dynamic system configuration
**Access**: Admin users only

**Document Structure**:
```json
{
  "_id": "ObjectId",
  "key": "email_notifications",
  "value": true,
  "category": "notification",
  "description": "Enable email notifications",
  "data_type": "boolean",
  "is_public": false,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "updated_by": "ObjectId(admin_id)"
}
```

#### **8. `audit_logs` Collection**
**Purpose**: Security audit trails and system logs
**Access**: Admin users only

**Document Structure**:
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId(user_id)",
  "user_email": "admin@evep.com",
  "action": "user_created",
  "resource": "users",
  "resource_id": "ObjectId(resource_id)",
  "details": {
    "email": "newuser@email.com",
    "role": "teacher"
  },
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "timestamp": "2024-01-15T10:30:00Z",
  "success": true
}
```

---

## 🔐 **Access Control Matrix**

### **User Type Access to Collections**

| Collection | Admin | Super Admin | Doctor | Nurse | Medical Staff | Exclusive Hospital | Teacher | Parent |
|------------|-------|-------------|--------|-------|---------------|-------------------|---------|--------|
| `users` | ✅ Read/Write | ✅ Read/Write | ❌ | ❌ | ❌ | ❌ | ✅ Read (limited) | ❌ |
| `admin_users` | ✅ Read/Write | ✅ Read/Write | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `medical_staff_users` | ✅ Read/Write | ✅ Read/Write | ✅ Read | ✅ Read | ✅ Read | ✅ Read | ❌ | ❌ |
| `patients` | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | ✅ Read | ✅ Read | ✅ Read/Write (limited) | ✅ Read (own) |
| `screenings` | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | ✅ Read | ✅ Read | ✅ Create | ❌ |
| `school_screenings` | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | ✅ Read | ✅ Read | ✅ Read/Write (own) | ✅ Read (own) |
| `system_settings` | ✅ Read/Write | ✅ Read/Write | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `audit_logs` | ✅ Read | ✅ Read/Write | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 🔄 **Data Relationships**

### **User Relationships**
```
admin_users (1) ←→ (1) audit_logs
medical_staff_users (1) ←→ (N) patients
medical_staff_users (1) ←→ (N) screenings
users (teachers) (1) ←→ (N) school_screenings
users (teachers) (1) ←→ (N) patients
users (parents) (1) ←→ (N) patients
```

### **Data Flow**
```
1. Teachers create school_screenings
2. Medical staff review school_screenings
3. Medical staff create comprehensive screenings
4. Patients are linked to both screening types
5. Admin users manage all collections
6. Audit logs track all changes
```

---

## 🚀 **Benefits of This Structure**

### **1. Clear Separation of Concerns**
- **User Types**: Separate collections for different user categories
- **Data Types**: Separate collections for different data categories
- **Access Control**: Granular permissions per collection

### **2. Enhanced Security**
- **Role-Based Access**: Different access levels per user type
- **Data Isolation**: Medical data separate from general data
- **Audit Trail**: Complete tracking of all changes

### **3. Scalability**
- **Independent Scaling**: Each collection can be scaled independently
- **Performance**: Optimized queries per collection
- **Maintenance**: Easier to maintain and update

### **4. Data Integrity**
- **Referential Integrity**: Clear relationships between collections
- **Validation**: Collection-specific validation rules
- **Consistency**: Consistent data structure across collections

---

## 🔧 **Implementation Notes**

### **Indexes**
```javascript
// Users collections
db.users.createIndex({ "email": 1 }, { unique: true })
db.admin_users.createIndex({ "email": 1 }, { unique: true })
db.medical_staff_users.createIndex({ "email": 1 }, { unique: true })

// Data collections
db.patients.createIndex({ "patient_id": 1 }, { unique: true })
db.screenings.createIndex({ "patient_id": 1 })
db.school_screenings.createIndex({ "patient_id": 1 })

// System collections
db.system_settings.createIndex({ "key": 1 }, { unique: true })
db.audit_logs.createIndex({ "timestamp": -1 })
```

### **Validation Rules**
```javascript
// Example validation for medical_staff_users
{
  validator: {
    $jsonSchema: {
      required: ["email", "name", "role", "password_hash"],
      properties: {
        role: {
          enum: ["doctor", "nurse", "medical_staff", "exclusive_hospital"]
        },
        medical_license: {
          type: "string"
        }
      }
    }
  }
}
```

---

## 📝 **Migration Strategy**

### **Phase 1: Create New Collections**
1. Create `medical_staff_users` collection
2. Create `school_screenings` collection
3. Update `system_settings` collection

### **Phase 2: Migrate Existing Data**
1. Move medical users from `users` to `medical_staff_users`
2. Move teacher screenings to `school_screenings`
3. Update references and relationships

### **Phase 3: Update Applications**
1. Update backend API endpoints
2. Update frontend applications
3. Update admin panel interfaces

---

## 🎯 **Summary**

The EVEP Platform database structure provides:

1. **Clear User Separation**: Different collections for different user types
2. **Specialized Data Collections**: Separate collections for different data types
3. **Enhanced Security**: Role-based access control per collection
4. **Scalable Architecture**: Independent collections for better performance
5. **Audit Trail**: Complete tracking of all system changes
6. **Data Integrity**: Consistent and validated data structure

**🔧 This database structure ensures optimal performance, security, and maintainability for the EVEP Platform!**



