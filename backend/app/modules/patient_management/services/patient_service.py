from typing import Dict, Any, List, Optional
from datetime import datetime, date
from app.core.config import Config
from app.core.event_bus import event_bus
from app.shared.models.patient import Patient, PatientCreate, PatientUpdate, PatientStatus, Gender

class PatientService:
    """Patient service for EVEP Platform"""
    
    def __init__(self):
        self.config = Config.get_module_config("patient_management")
        
        # In-memory storage for demonstration
        self.patients = {}
        self.patient_counter = 0
    
    async def initialize(self) -> None:
        """Initialize the patient service"""
        # In a real implementation, this would connect to the database
        # For now, we'll use in-memory storage for demonstration
        
        # Create some demo patients
        await self._create_demo_patients()
        
        print("🔧 Patient service initialized")
    
    async def _create_demo_patients(self) -> None:
        """Create demo patients for testing"""
        demo_patients = [
            {
                "name": "John Smith",
                "date_of_birth": date(2010, 5, 15),
                "gender": Gender.MALE,
                "contact_info": {
                    "phone": "+66-81-234-5678",
                    "email": "john.smith@email.com",
                    "address": "123 Sukhumvit Road, Bangkok"
                },
                "assigned_doctor": "doctor-001",
                "status": PatientStatus.ACTIVE
            },
            {
                "name": "Sarah Johnson",
                "date_of_birth": date(2012, 8, 22),
                "gender": Gender.FEMALE,
                "contact_info": {
                    "phone": "+66-82-345-6789",
                    "email": "sarah.johnson@email.com",
                    "address": "456 Silom Road, Bangkok"
                },
                "assigned_doctor": "doctor-002",
                "status": PatientStatus.ACTIVE
            },
            {
                "name": "Michael Chen",
                "date_of_birth": date(2008, 3, 10),
                "gender": Gender.MALE,
                "contact_info": {
                    "phone": "+66-83-456-7890",
                    "email": "michael.chen@email.com",
                    "address": "789 Rama IV Road, Bangkok"
                },
                "assigned_doctor": "doctor-001",
                "status": PatientStatus.INACTIVE
            }
        ]
        
        for patient_data in demo_patients:
            patient_create = PatientCreate(**patient_data)
            await self.create_patient(patient_create)
    
    async def get_patients(
        self,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        status: Optional[str] = None,
        assigned_doctor: Optional[str] = None
    ) -> List[Patient]:
        """Get patients with optional filtering"""
        patients = list(self.patients.values())
        
        # Apply filters
        if search:
            search_lower = search.lower()
            patients = [
                p for p in patients
                if search_lower in p.name.lower() or search_lower in p.patient_id.lower()
            ]
        
        if status:
            patients = [p for p in patients if p.status.value == status]
        
        if assigned_doctor:
            patients = [p for p in patients if p.assigned_doctor == assigned_doctor]
        
        # Apply pagination
        return patients[skip:skip + limit]
    
    async def get_patient(self, patient_id: str) -> Optional[Patient]:
        """Get a patient by ID"""
        return self.patients.get(patient_id)
    
    async def create_patient(self, patient_create: PatientCreate) -> Patient:
        """Create a new patient"""
        # Generate patient ID
        self.patient_counter += 1
        patient_id = f"PAT-{self.patient_counter:06d}"
        
        # Create patient
        patient = Patient(
            patient_id=patient_id,
            name=patient_create.name,
            date_of_birth=patient_create.date_of_birth,
            gender=patient_create.gender,
            contact_info=patient_create.contact_info or {},
            medical_history=patient_create.medical_history or {},
            status=patient_create.status or PatientStatus.ACTIVE,
            assigned_doctor=patient_create.assigned_doctor,
            notes=patient_create.notes
        )
        
        # Store patient
        self.patients[patient_id] = patient
        
        # Emit event
        await event_bus.emit("patient.created", {
            "patient_id": patient_id,
            "patient_data": patient.dict(),
            "user_id": "system"
        })
        
        return patient
    
    async def update_patient(self, patient_id: str, patient_update: PatientUpdate) -> Optional[Patient]:
        """Update a patient"""
        if patient_id not in self.patients:
            return None
        
        patient = self.patients[patient_id]
        
        # Track changes
        changes = {}
        
        # Update fields if provided
        if patient_update.name is not None:
            changes["name"] = {"old": patient.name, "new": patient_update.name}
            patient.name = patient_update.name
        
        if patient_update.date_of_birth is not None:
            changes["date_of_birth"] = {"old": patient.date_of_birth, "new": patient_update.date_of_birth}
            patient.date_of_birth = patient_update.date_of_birth
        
        if patient_update.gender is not None:
            changes["gender"] = {"old": patient.gender, "new": patient_update.gender}
            patient.gender = patient_update.gender
        
        if patient_update.contact_info is not None:
            changes["contact_info"] = {"old": patient.contact_info, "new": patient_update.contact_info}
            patient.contact_info = patient_update.contact_info
        
        if patient_update.medical_history is not None:
            changes["medical_history"] = {"old": patient.medical_history, "new": patient_update.medical_history}
            patient.medical_history = patient_update.medical_history
        
        if patient_update.status is not None:
            changes["status"] = {"old": patient.status, "new": patient_update.status}
            patient.status = patient_update.status
        
        if patient_update.assigned_doctor is not None:
            changes["assigned_doctor"] = {"old": patient.assigned_doctor, "new": patient_update.assigned_doctor}
            patient.assigned_doctor = patient_update.assigned_doctor
        
        if patient_update.notes is not None:
            changes["notes"] = {"old": patient.notes, "new": patient_update.notes}
            patient.notes = patient_update.notes
        
        # Update timestamp
        patient.updated_at = datetime.utcnow()
        
        # Emit event if there were changes
        if changes:
            await event_bus.emit("patient.updated", {
                "patient_id": patient_id,
                "changes": changes,
                "user_id": "system"
            })
        
        return patient
    
    async def delete_patient(self, patient_id: str) -> bool:
        """Delete a patient (soft delete)"""
        if patient_id not in self.patients:
            return False
        
        patient = self.patients[patient_id]
        patient.status = PatientStatus.INACTIVE
        patient.updated_at = datetime.utcnow()
        
        # Emit event
        await event_bus.emit("patient.deleted", {
            "patient_id": patient_id,
            "user_id": "system"
        })
        
        return True
    
    async def get_patient_statistics(self) -> Dict[str, Any]:
        """Get patient statistics"""
        total_patients = len(self.patients)
        active_patients = len([p for p in self.patients.values() if p.status == PatientStatus.ACTIVE])
        inactive_patients = len([p for p in self.patients.values() if p.status == PatientStatus.INACTIVE])
        
        # Gender distribution
        gender_counts = {}
        for patient in self.patients.values():
            gender = patient.gender.value
            gender_counts[gender] = gender_counts.get(gender, 0) + 1
        
        # Age distribution
        age_groups = {"0-5": 0, "6-12": 0, "13-18": 0, "19+": 0}
        current_date = date.today()
        
        for patient in self.patients.values():
            age = current_date.year - patient.date_of_birth.year
            if current_date < date(current_date.year, patient.date_of_birth.month, patient.date_of_birth.day):
                age -= 1
            
            if age <= 5:
                age_groups["0-5"] += 1
            elif age <= 12:
                age_groups["6-12"] += 1
            elif age <= 18:
                age_groups["13-18"] += 1
            else:
                age_groups["19+"] += 1
        
        # Doctor assignment distribution
        doctor_counts = {}
        for patient in self.patients.values():
            doctor = patient.assigned_doctor or "Unassigned"
            doctor_counts[doctor] = doctor_counts.get(doctor, 0) + 1
        
        return {
            "total_patients": total_patients,
            "active_patients": active_patients,
            "inactive_patients": inactive_patients,
            "gender_distribution": gender_counts,
            "age_distribution": age_groups,
            "doctor_assignment": doctor_counts,
            "last_updated": datetime.utcnow()
        }
    
    async def advanced_search(self, filters: Dict[str, Any]) -> List[Patient]:
        """Advanced patient search with multiple filters"""
        patients = list(self.patients.values())
        
        # Apply name filter
        if "name" in filters:
            name_filter = filters["name"].lower()
            patients = [p for p in patients if name_filter in p.name.lower()]
        
        # Apply age filters
        if "age_min" in filters or "age_max" in filters:
            current_date = date.today()
            age_min = filters.get("age_min", 0)
            age_max = filters.get("age_max", 150)
            
            filtered_patients = []
            for patient in patients:
                age = current_date.year - patient.date_of_birth.year
                if current_date < date(current_date.year, patient.date_of_birth.month, patient.date_of_birth.day):
                    age -= 1
                
                if age_min <= age <= age_max:
                    filtered_patients.append(patient)
            
            patients = filtered_patients
        
        # Apply gender filter
        if "gender" in filters:
            gender_filter = filters["gender"].lower()
            patients = [p for p in patients if p.gender.value.lower() == gender_filter]
        
        # Apply assigned doctor filter
        if "assigned_doctor" in filters:
            doctor_filter = filters["assigned_doctor"]
            patients = [p for p in patients if p.assigned_doctor == doctor_filter]
        
        # Apply status filter
        if "status" in filters:
            status_filter = filters["status"]
            patients = [p for p in patients if p.status.value == status_filter]
        
        # Apply date filters
        if "created_after" in filters or "created_before" in filters:
            created_after = filters.get("created_after")
            created_before = filters.get("created_before")
            
            filtered_patients = []
            for patient in patients:
                created_date = patient.created_at.date()
                
                if created_after and created_date < datetime.strptime(created_after, "%Y-%m-%d").date():
                    continue
                
                if created_before and created_date > datetime.strptime(created_before, "%Y-%m-%d").date():
                    continue
                
                filtered_patients.append(patient)
            
            patients = filtered_patients
        
        return patients
    
    async def search_patients_by_name(self, name: str) -> List[Patient]:
        """Search patients by name"""
        name_lower = name.lower()
        return [
            p for p in self.patients.values()
            if name_lower in p.name.lower()
        ]
    
    async def get_patients_by_doctor(self, doctor_id: str) -> List[Patient]:
        """Get all patients assigned to a specific doctor"""
        return [
            p for p in self.patients.values()
            if p.assigned_doctor == doctor_id
        ]
    
    async def get_patients_by_status(self, status: PatientStatus) -> List[Patient]:
        """Get all patients with a specific status"""
        return [
            p for p in self.patients.values()
            if p.status == status
        ]
    
    async def get_patients_by_age_range(self, min_age: int, max_age: int) -> List[Patient]:
        """Get patients within a specific age range"""
        current_date = date.today()
        patients = []
        
        for patient in self.patients.values():
            age = current_date.year - patient.date_of_birth.year
            if current_date < date(current_date.year, patient.date_of_birth.month, patient.date_of_birth.day):
                age -= 1
            
            if min_age <= age <= max_age:
                patients.append(patient)
        
        return patients
    
    async def assign_doctor(self, patient_id: str, doctor_id: str) -> Optional[Patient]:
        """Assign a doctor to a patient"""
        if patient_id not in self.patients:
            return None
        
        patient = self.patients[patient_id]
        old_doctor = patient.assigned_doctor
        patient.assigned_doctor = doctor_id
        patient.updated_at = datetime.utcnow()
        
        # Emit event
        await event_bus.emit("patient.updated", {
            "patient_id": patient_id,
            "changes": {
                "assigned_doctor": {"old": old_doctor, "new": doctor_id}
            },
            "user_id": "system"
        })
        
        return patient
    
    async def update_patient_status(self, patient_id: str, status: PatientStatus) -> Optional[Patient]:
        """Update patient status"""
        if patient_id not in self.patients:
            return None
        
        patient = self.patients[patient_id]
        old_status = patient.status
        patient.status = status
        patient.updated_at = datetime.utcnow()
        
        # Emit event
        await event_bus.emit("patient.updated", {
            "patient_id": patient_id,
            "changes": {
                "status": {"old": old_status, "new": status}
            },
            "user_id": "system"
        })
        
        return patient



