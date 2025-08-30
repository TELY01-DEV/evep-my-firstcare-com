# 👁️ Copilot Prompt – EVEP Student, Parent & Teacher Data Models

This prompt is for implementing data models and CRUD forms for the EYE AND VISION EXAMINATION PLATFORM (EVEP) using MongoDB and FastAPI backend.

---

## 🎯 Objectives

- Create MongoDB collections and Pydantic models for:
  - Student (with nested Parent info and address)
  - Teacher (with school and workplace address)
- Ensure all models support full CRUD operations
- Use React Admin (Mantis React) for front-end forms

---

## 🧠 MongoDB Collections

### `students`

```json
{
  "_id": ObjectId,
  "title": "ด.ช.",
  "first_name": "ชื่อ",
  "last_name": "นามสกุล",
  "cid": "1234567890123",
  "birth_date": "YYYY-MM-DD",
  "gender": "M",
  "student_code": "ABC123",
  "school_name": "โรงเรียนทดสอบ",
  "grade_level": "ป.4",
  "grade_number": "2",
  "address": {
    "house_no": "",
    "village_no": "",
    "soi": "",
    "road": "",
    "subdistrict": "",
    "district": "",
    "province": ""
  },
  "disease": "",
  "parent_id": "ObjectId",  // Reference to parents collection
  "consent_document": true
}
```

---

### `parents`

```json
{
  "_id": ObjectId,
  "first_name": "ชื่อผู้ปกครอง",
  "last_name": "นามสกุล",
  "cid": "1234567890123",
  "birth_date": "YYYY-MM-DD",
  "gender": "F",
  "phone": "0812345678",
  "email": "parent@example.com",
  "relation": "มารดา",  // or "บิดา", "ผู้ปกครอง", "ญาติ"
  "occupation": "พนักงานบริษัท",
  "income_level": "middle",  // "low", "middle", "high"
  "address": {
    "house_no": "",
    "village_no": "",
    "soi": "",
    "road": "",
    "subdistrict": "",
    "district": "",
    "province": "",
    "postal_code": "12345"
  },
  "emergency_contact": {
    "name": "ชื่อผู้ติดต่อฉุกเฉิน",
    "phone": "0898765432",
    "relation": "ญาติ"
  },
  "created_at": "2025-08-29T10:00:00Z",
  "updated_at": "2025-08-29T10:00:00Z"
}
```

---

### `teachers`

```json
{
  "_id": ObjectId,
  "first_name": "ชื่อ",
  "last_name": "นามสกุล",
  "cid": "1234567890123",
  "birth_date": "YYYY-MM-DD",
  "gender": "F",
  "phone": "0899999999",
  "email": "example@email.com",
  "school": "โรงเรียนทดสอบ",
  "position": "ครูประจำชั้น",
  "school_year": "2568",
  "work_address": {
    "house_no": "",
    "village_no": "",
    "soi": "",
    "road": "",
    "subdistrict": "",
    "district": "",
    "province": ""
  }
}
```

---

## 🧾 FastAPI Pydantic Models

### `Address`

```python
class Address(BaseModel):
    house_no: Optional[str]
    village_no: Optional[str]
    soi: Optional[str]
    road: Optional[str]
    subdistrict: Optional[str]
    district: Optional[str]
    province: Optional[str]
    postal_code: Optional[str] = None
```

### `EmergencyContact`

```python
class EmergencyContact(BaseModel):
    name: str
    phone: str
    relation: str
```

### `Parent`

```python
class Parent(BaseModel):
    first_name: str
    last_name: str
    cid: str
    birth_date: date
    gender: str
    phone: str
    email: Optional[str]
    relation: str
    occupation: Optional[str]
    income_level: Optional[Literal["low", "middle", "high"]]
    address: Address
    emergency_contact: EmergencyContact
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

### `Student`

```python
class Student(BaseModel):
    title: str
    first_name: str
    last_name: str
    cid: str
    birth_date: date
    gender: str
    student_code: Optional[str]
    school_name: str
    grade_level: str
    grade_number: Optional[str]
    address: Address
    disease: Optional[str]
    parent_id: str  # Reference to parent document
    consent_document: bool = False
```

### `Teacher`

```python
class Teacher(BaseModel):
    first_name: str
    last_name: str
    cid: str
    birth_date: date
    gender: str
    phone: str
    email: str
    school: str
    position: Optional[str]
    school_year: Optional[str]
    work_address: Address
```

---

## ✅ Ready for Implementation in FastAPI & React Admin (Mantis)

---

# 🏫 Additional Models: School & Staff (สำหรับ EVEP Admin Panel)

## 🏫 School Information

### MongoDB Collection: `schools`

```json
{
  "_id": ObjectId,
  "school_code": "100001",
  "name": "โรงเรียนบ้านหนองฟ้า",
  "type": "ประถมศึกษา",
  "address": {
    "house_no": "",
    "village_no": "",
    "soi": "",
    "road": "",
    "subdistrict": "",
    "district": "",
    "province": "",
    "postal_code": "12345"
  },
  "phone": "042123456",
  "email": "school@example.com"
}
```

### FastAPI Pydantic Model

```python
class School(BaseModel):
    school_code: str
    name: str
    type: str
    address: Address
    phone: Optional[str]
    email: Optional[str]
```

---

## 👩‍⚕️ Admin / Staff User

### MongoDB Collection: `users`

```json
{
  "_id": ObjectId,
  "full_name": "นพ. สาธารณสุข",
  "email": "staff@evep.com",
  "phone": "0812345678",
  "role": "admin",
  "password_hash": "...",
  "organization_id": "school_id or hospital_id",
  "created_at": "2025-08-29T10:00:00Z"
}
```

### Roles Supported

- `"admin"` – System administrator
- `"executive"` – View dashboards
- `"teacher"` – Assigned to school
- `"doctor"` / `"optometrist"` – Medical staff
- `"vendor"` – Glasses provider

### FastAPI Pydantic Model

```python
class User(BaseModel):
    full_name: str
    email: str
    phone: Optional[str]
    role: Literal["admin", "executive", "teacher", "doctor", "optometrist", "vendor"]
    organization_id: Optional[str]
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

---

## ✅ With this update, the system can now:
- Register/manage schools
- Assign users to schools/hospitals
- Role-based access control (RBAC) works with user collection

---

## 🏫 MongoDB Collection: `organizations` (School/Clinic/Hospital)

```json
{
  "_id": ObjectId,
  "name": "โรงเรียนบ้านตัวอย่าง",
  "type": "school",  // or "clinic", "hospital"
  "code": "SCH001",
  "address": {
    "house_no": "",
    "village_no": "",
    "soi": "",
    "road": "",
    "subdistrict": "",
    "district": "",
    "province": ""
  },
  "contact_person": {
    "name": "ครูประจำโครงการ",
    "phone": "0811111111",
    "email": "school@example.com"
  }
}
```

## 🧑‍⚕️ MongoDB Collection: `staff`

```json
{
  "_id": ObjectId,
  "first_name": "ชื่อ",
  "last_name": "นามสกุล",
  "cid": "1234567890123",
  "birth_date": "YYYY-MM-DD",
  "gender": "M",
  "phone": "0891234567",
  "email": "staff@example.com",
  "role": "doctor",  // or "optometrist", "admin", "executive"
  "organization_id": "ORG001"
}
```

---

## 🧾 Pydantic Models

### `Organization`

```python
class Organization(BaseModel):
    name: str
    type: Literal["school", "clinic", "hospital"]
    code: str
    address: Address
    contact_person: dict  # includes name, phone, email
```

### `Staff`

```python
class Staff(BaseModel):
    first_name: str
    last_name: str
    cid: str
    birth_date: date
    gender: str
    phone: str
    email: str
    role: Literal["doctor", "optometrist", "admin", "executive"]
    organization_id: str
```

