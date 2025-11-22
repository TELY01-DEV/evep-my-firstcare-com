#!/usr/bin/env python3
"""
Screening Session Creation - 422 Error Analysis

Based on the API code analysis, this script identifies the most likely
causes of 422 Unprocessable Content errors when creating screening sessions.
"""

print("""
🔍 SCREENING SESSION CREATION - 422 ERROR ANALYSIS
==================================================

PROBLEM: POST /api/v1/screenings/sessions returns 422 (Unprocessable Content)
This means the API is rejecting the request data due to validation errors.

COMMON CAUSES OF 422 ERRORS:
============================

1. ❌ MISSING REQUIRED FIELDS
   Required fields in ScreeningSessionCreate:
   - patient_id (string)
   - examiner_id (string) 
   - screening_type (string)
   - screening_category (string)

2. ❌ INVALID PATIENT_ID OR EXAMINER_ID
   - IDs must be valid MongoDB ObjectId format (24 hex characters)
   - Patient must exist in the database
   - Example: "507f1f77bcf86cd799439011"

3. ❌ CONFLICTING ACTIVE SESSION
   The API checks for existing active sessions with these statuses:
   - "in_progress", "pending", "Register waiting for screening"
   - "Appointment Schedule", "Parent Consent", "Student Registration"
   - "VA Screening", "Doctor Diagnosis", "Glasses Selection" 
   - "Inventory Check", "School Delivery"
   
   If the patient already has an active session, you get a 409 Conflict error.

4. ❌ INVALID SCREENING_CATEGORY FOR USER ROLE
   - Teachers can only create "school_screening" sessions
   - Doctors can only create "medical_screening" sessions
   - Super admins can create any type

5. ❌ INVALID DATA TYPES OR VALUES
   - status: must be valid status string
   - current_step: must be integer
   - workflow_data: must be valid JSON object

DEBUGGING STEPS:
===============

STEP 1: Check Browser Network Tab
---------------------------------
1. Open browser Developer Tools (F12)
2. Go to Network tab
3. Try creating the screening session
4. Look at the POST request to /api/v1/screenings/sessions
5. Check the request payload and response

STEP 2: Verify Required Fields
-----------------------------
Ensure your frontend is sending:
```json
{
  "patient_id": "valid_24_char_objectid",
  "examiner_id": "valid_24_char_objectid", 
  "screening_type": "distance|near|comprehensive|etc",
  "screening_category": "medical_screening|school_screening"
}
```

STEP 3: Check Patient and Examiner IDs
-------------------------------------
- Patient ID should be from an existing patient
- Examiner ID should be from an existing user
- Both must be 24-character hex strings

STEP 4: Check for Active Sessions
--------------------------------
Query: GET /api/v1/screenings/sessions?patient_id=PATIENT_ID
Look for sessions with active statuses listed above.

STEP 5: Verify User Role Permissions
-----------------------------------
- If user role is "teacher", screening_category must be "school_screening"
- If user role is "doctor", screening_category must be "medical_screening" 
- Super admin can use any category

FRONTEND CODE FIXES:
===================

1. VALIDATE IDS BEFORE SENDING
```typescript
// Check if IDs are valid ObjectId format
const isValidObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);

if (!isValidObjectId(patientId)) {
  console.error('Invalid patient ID format:', patientId);
  return;
}
```

2. CHECK FOR ACTIVE SESSIONS FIRST
```typescript
// Before creating, check for existing sessions
const existingSessions = await api.get(`/screenings/sessions?patient_id=${patientId}`);
const activeSessions = existingSessions.filter(s => 
  ['in_progress', 'pending', 'VA Screening', 'Doctor Diagnosis'].includes(s.status)
);

if (activeSessions.length > 0) {
  alert('Patient already has an active screening session');
  return;
}
```

3. SET CORRECT SCREENING CATEGORY
```typescript
// Set category based on user role
const userRole = getCurrentUserRole();
const screeningCategory = userRole === 'teacher' ? 'school_screening' : 'medical_screening';
```

API VALIDATION RULES:
====================

From the backend code analysis:

1. Patient existence check:
   ```python
   patient = await db.evep.patients.find_one({"_id": ObjectId(session_data.patient_id)})
   if not patient:
       raise HTTPException(404, "Patient not found")
   ```

2. Active session conflict check:
   ```python
   existing_session = await db.evep.screenings.find_one({
       "patient_id": ObjectId(session_data.patient_id),
       "status": {"$in": ["in_progress", "pending", "VA Screening", ...]}
   })
   if existing_session:
       raise HTTPException(409, "Patient already has active session")
   ```

3. Role-based category validation:
   ```python
   if await has_role_db(user_id, "teacher") and session_data.screening_category != "school_screening":
       raise HTTPException(400, "Teachers can only create school screening sessions")
   ```

MANUAL API TEST:
===============

You can test the API directly with curl:

```bash
# Get auth token
curl -X POST "https://stardust.evep.my-firstcare.com/api/v1/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{"username": "your_email", "password": "your_password"}'

# Test screening creation
curl -X POST "https://stardust.evep.my-firstcare.com/api/v1/screenings/sessions" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "patient_id": "VALID_PATIENT_ID", 
    "examiner_id": "VALID_USER_ID",
    "screening_type": "comprehensive", 
    "screening_category": "medical_screening"
  }'
```

LIKELY SOLUTIONS:
================

Based on your error occurring at step 5 "Doctor Diagnosis":

1. ✅ Check if patient already has an active session
2. ✅ Verify the patient_id and examiner_id are valid ObjectIds
3. ✅ Ensure screening_category matches your user role
4. ✅ Check that required workflow_data is properly formatted

Most likely cause: The patient probably already has an active screening session 
in the database that wasn't properly cleaned up from previous testing.

NEXT STEPS:
==========

1. Check browser Network tab for the exact 422 error details
2. Verify the patient doesn't have existing active sessions
3. Ensure all IDs are valid ObjectId format
4. Check that screening_category matches user permissions

""")

if __name__ == "__main__":
    print("\\n" + "="*60)
    print("This analysis is based on the API code structure.")
    print("For specific debugging, check the browser Network tab")
    print("to see the exact request/response data.")
    print("="*60)