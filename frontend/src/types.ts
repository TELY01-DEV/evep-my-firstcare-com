// EVEP Frontend Types
// This file contains TypeScript type definitions for the EVEP platform

export interface Reading {
  id: string;
  patientId: string;
  timestamp: string;
  value: number;
  unit: string;
  type: string;
  notes?: string;
}

export interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  schoolId?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface School {
  id: string;
  name: string;
  address: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScreeningResult {
  id: string;
  patientId: string;
  screeningType: string;
  result: string;
  notes?: string;
  performedBy: string;
  performedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

