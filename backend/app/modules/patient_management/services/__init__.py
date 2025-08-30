# EVEP Platform - Patient Management Services
# This module contains patient management-related services

from .patient_service import PatientService
from .demographics_service import DemographicsService
from .medical_history_service import MedicalHistoryService

__all__ = [
    'PatientService',
    'DemographicsService',
    'MedicalHistoryService'
]



