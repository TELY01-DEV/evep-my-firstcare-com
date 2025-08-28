import React, { useState } from 'react';
import { Box, Typography, Paper, Button, Dialog, DialogContent } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import PatientList from '../components/Patients/PatientList';
import PatientForm from '../components/Patients/PatientForm';

interface Patient {
  patient_id?: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  parent_email: string;
  parent_phone?: string;
  school_name?: string;
  grade?: string;
  medical_history?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  insurance_info?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

const Patients: React.FC = () => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [showPatientDetails, setShowPatientDetails] = useState(false);

  const handleAddPatient = () => {
    setSelectedPatient(null);
    setFormMode('add');
    setShowForm(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormMode('edit');
    setShowForm(true);
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientDetails(true);
  };

  const handleDeletePatient = (patientId: string) => {
    // Handle patient deletion
    console.log('Patient deleted:', patientId);
  };

  const handleSavePatient = (patient: Patient) => {
    setShowForm(false);
    // Refresh the patient list
    window.location.reload();
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setSelectedPatient(null);
  };

  const handleCloseDetails = () => {
    setShowPatientDetails(false);
    setSelectedPatient(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <PatientList
        onPatientSelect={handlePatientSelect}
        onAddPatient={handleAddPatient}
        onEditPatient={handleEditPatient}
        onDeletePatient={handleDeletePatient}
      />

      {/* Add/Edit Patient Form Dialog */}
      <Dialog
        open={showForm}
        onClose={handleCancelForm}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '90vh',
            overflow: 'auto'
          }
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <PatientForm
            patient={selectedPatient}
            onSave={handleSavePatient}
            onCancel={handleCancelForm}
            mode={formMode}
          />
        </DialogContent>
      </Dialog>

      {/* Patient Details Dialog */}
      <Dialog
        open={showPatientDetails}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          {selectedPatient && (
            <Box>
              <Typography variant="h5" gutterBottom>
                Patient Details
              </Typography>
              <Paper sx={{ p: 3 }}>
                <Typography variant="body1">
                  Detailed patient information will be displayed here.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Patient ID: {selectedPatient.patient_id}
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Patients;
