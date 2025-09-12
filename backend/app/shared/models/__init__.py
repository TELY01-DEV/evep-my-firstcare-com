# EVEP Platform - Shared Models
# This module contains shared data models used across all modules

from .base import BaseModel
from .user import User, UserCreate, UserUpdate
from .patient import Patient, PatientCreate, PatientUpdate
from .screening import Screening, ScreeningCreate, ScreeningUpdate
from .school_screening import SchoolScreening, SchoolScreeningCreate, SchoolScreeningUpdate

__all__ = [
    'BaseModel',
    'User',
    'UserCreate', 
    'UserUpdate',
    'Patient',
    'PatientCreate',
    'PatientUpdate',
    'Screening',
    'ScreeningCreate',
    'ScreeningUpdate',
    'SchoolScreening',
    'SchoolScreeningCreate',
    'SchoolScreeningUpdate'
]



