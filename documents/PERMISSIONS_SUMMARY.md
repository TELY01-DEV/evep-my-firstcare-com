# 🔐 **EVEP Platform Permissions Summary**

## 📋 **Patient Management Permissions**

### **Who CAN create patients directly:**
- **Doctors** (`role: "doctor"`) ✅
- **Medical Staff** (`role: "medical_staff"`) ✅  
- **Admins** (`role: "admin"`) ✅

### **Who CANNOT create patients directly:**
- **Teachers** (`role: "teacher"`) ❌
- **Parents** (`role: "parent"`) ❌
- **Students** (`role: "student"`) ❌

### **Who CAN view patients:**
- **Doctors** (`role: "doctor"`) ✅
- **Medical Staff** (`role: "medical_staff"`) ✅
- **Parents** (`role: "parent"`) ✅ (only their own children)
- **Admins** (`role: "admin"`) ✅

### **Who CAN update patients:**
- **Doctors** (`role: "doctor"`) ✅
- **Admins** (`role: "admin"`) ✅

### **Who CAN search patients:**
- **Doctors** (`role: "doctor"`) ✅
- **Medical Staff** (`role: "medical_staff"`) ✅
- **Parents** (`role: "parent"`) ✅ (only their own children)
- **Admins** (`role: "admin"`) ✅

### **Who CAN view patient documents:**
- **Doctors** (`role: "doctor"`) ✅
- **Medical Staff** (`role: "medical_staff"`) ✅
- **Parents** (`role: "parent"`) ✅ (only their own children's documents)
- **Admins** (`role: "admin"`) ✅

## 🔍 **Screening Management Permissions**

### **Screening Categories:**
1. **School Screening** (`screening_category: "school_screening"`)
   - Created by: **Teachers** ✅
   - Purpose: School-based vision screening programs
   - Equipment: Basic screening tools

2. **Medical Screening** (`screening_category: "medical_screening"`)
   - Created by: **Doctors** ✅
   - Purpose: Professional medical vision assessment
   - Equipment: Advanced medical equipment

### **Who CAN create screening sessions:**
- **Teachers** (`role: "teacher"`) ✅ (school_screening only)
- **Doctors** (`role: "doctor"`) ✅ (medical_screening only)
- **Admins** (`role: "admin"`) ✅ (both categories)

### **Who CAN view screening sessions:**
- **Teachers** (`role: "teacher"`) ✅ (school_screening only)
- **Doctors** (`role: "doctor"`) ✅ (medical_screening only)
- **Admins** (`role: "admin"`) ✅ (both categories)

### **Who CAN view screening analytics:**
- **Teachers** (`role: "teacher"`) ✅ (school_screening analytics only)
- **Doctors** (`role: "doctor"`) ✅ (medical_screening analytics only)
- **Admins** (`role: "admin"`) ✅ (all analytics)

## 🎓 **Student-to-Patient Registration**

### **Who CAN register students as patients:**
- **Doctors** (`role: "doctor"`) ✅
- **Admins** (`role: "admin"`) ✅
- **Medical Staff** (`role: "medical_staff"`) ✅

### **Process:**
1. Student data is fetched from EVEP system
2. Parent data is retrieved for emergency contact
3. Patient record is created with `source: "student_registration"`
4. Original `student_id` is linked to patient record

## 🔄 **Key Changes Made:**

### **Patient API (`backend/app/api/patients.py`):**
- ✅ Removed `"teacher"` from patient creation permissions
- ✅ Removed `"teacher"` from patient viewing permissions
- ✅ Removed `"teacher"` from patient search permissions
- ✅ Removed `"teacher"` from patient document viewing permissions
- ✅ Removed `"teacher"` from student-to-patient registration permissions

### **Screening API (`backend/app/api/screenings.py`):**
- ✅ Added `screening_category` field to distinguish school vs medical screenings
- ✅ Added role-based validation for screening categories
- ✅ Added filtering endpoints for different screening types
- ✅ Updated analytics to respect screening categories
- ✅ Teachers can only create/view school screenings
- ✅ Doctors can only create/view medical screenings

## 🎯 **Business Logic:**

### **Patient Creation Flow:**
1. **Direct Creation**: Only medical staff (doctors, medical_staff, admins) can create patients directly
2. **Student Registration**: Students can be registered as patients by medical staff
3. **Parent Access**: Parents can only view their own children's records

### **Screening Workflow:**
1. **School Screening**: Teachers conduct basic vision screening in schools
2. **Medical Screening**: Doctors conduct professional medical assessments
3. **Separation**: School and medical screenings are completely separate
4. **Analytics**: Each role sees only relevant screening data

## 🔒 **Security Features:**
- Role-based access control (RBAC)
- Audit logging for all patient and screening operations
- Blockchain-style audit hashes for data integrity
- Parent-child relationship validation
- Screening category enforcement

---

**Last Updated**: January 2025
**Version**: 1.0
