
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
  "parent": {
    "first_name": "ชื่อผู้ปกครอง",
    "last_name": "นามสกุล",
    "phone": "0812345678",
    "relation": "มารดา",
    "address": { ... }
  },
  "consent_document": true
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
```

### `ParentInfo`

```python
class ParentInfo(BaseModel):
    first_name: str
    last_name: str
    phone: str
    relation: str
    address: Address
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
    parent: ParentInfo
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


---

## ✅ Ready for Implementation in FastAPI & React Admin (Mantis)
