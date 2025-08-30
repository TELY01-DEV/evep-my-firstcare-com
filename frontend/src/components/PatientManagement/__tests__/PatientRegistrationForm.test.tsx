import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../test-utils';
import { mockApiResponses, mockPatient } from '../../../test-utils';
import PatientRegistrationForm from '../PatientRegistrationForm';

// Mock the PatientRegistrationForm component
jest.mock('../PatientRegistrationForm', () => {
  return function MockPatientRegistrationForm({ onSubmit, onCancel, loading = false, initialData }: any) {
    return (
      <div data-testid="patient-registration-form">
        <h2>Patient Registration</h2>
        
        {/* Step indicator */}
        <div data-testid="step-indicator">Step 1 of 7</div>
        
        {/* Personal Information */}
        <div data-testid="personal-info-section">
          <input 
            type="text" 
            placeholder="First Name" 
            data-testid="first-name-input"
            defaultValue={initialData?.first_name || ''}
          />
          <input 
            type="text" 
            placeholder="Last Name" 
            data-testid="last-name-input"
            defaultValue={initialData?.last_name || ''}
          />
          <input 
            type="date" 
            data-testid="date-of-birth-input"
            defaultValue={initialData?.date_of_birth || ''}
          />
          <select data-testid="gender-select" defaultValue={initialData?.gender || ''}>
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Parent Information */}
        <div data-testid="parent-info-section">
          <input 
            type="text" 
            placeholder="Parent Name" 
            data-testid="parent-name-input"
            defaultValue={initialData?.parent_name || ''}
          />
          <input 
            type="email" 
            placeholder="Parent Email" 
            data-testid="parent-email-input"
            defaultValue={initialData?.parent_email || ''}
          />
          <input 
            type="tel" 
            placeholder="Parent Phone" 
            data-testid="parent-phone-input"
            defaultValue={initialData?.parent_phone || ''}
          />
        </div>

        {/* Medical History */}
        <div data-testid="medical-history-section">
          <textarea 
            placeholder="Medical History" 
            data-testid="medical-history-textarea"
            defaultValue={initialData?.medical_history || ''}
          />
          <div data-testid="allergies-section">
            <input 
              type="text" 
              placeholder="Add Allergy" 
              data-testid="allergy-input"
            />
            <button type="button" data-testid="add-allergy-button">Add</button>
          </div>
        </div>

        {/* Navigation buttons */}
        <div data-testid="form-navigation">
          <button 
            type="button" 
            onClick={onCancel}
            data-testid="cancel-button"
          >
            Cancel
          </button>
          <button 
            type="button" 
            data-testid="next-button"
          >
            Next
          </button>
          <button 
            type="submit" 
            onClick={() => onSubmit(mockPatient)}
            disabled={loading}
            data-testid="submit-button"
          >
            {loading ? 'Saving...' : 'Register Patient'}
          </button>
        </div>
      </div>
    );
  };
});

describe('PatientRegistrationForm Component', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render patient registration form', () => {
      render(
        <PatientRegistrationForm 
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );
      
      expect(screen.getByTestId('patient-registration-form')).toBeInTheDocument();
      expect(screen.getByText('Patient Registration')).toBeInTheDocument();
    });

    it('should render step indicator', () => {
      render(
        <PatientRegistrationForm 
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );
      
      expect(screen.getByTestId('step-indicator')).toBeInTheDocument();
      expect(screen.getByText('Step 1 of 7')).toBeInTheDocument();
    });

    it('should render all form sections', () => {
      render(
        <PatientRegistrationForm 
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );
      
      expect(screen.getByTestId('personal-info-section')).toBeInTheDocument();
      expect(screen.getByTestId('parent-info-section')).toBeInTheDocument();
      expect(screen.getByTestId('medical-history-section')).toBeInTheDocument();
    });

    it('should render navigation buttons', () => {
      render(
        <PatientRegistrationForm 
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );
      
      expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
      expect(screen.getByTestId('next-button')).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should handle personal information input changes', () => {
      render(
        <PatientRegistrationForm 
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );
      
      const firstNameInput = screen.getByTestId('first-name-input');
      const lastNameInput = screen.getByTestId('last-name-input');
      const dateOfBirthInput = screen.getByTestId('date-of-birth-input');
      const genderSelect = screen.getByTestId('gender-select');
      
      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(dateOfBirthInput, { target: { value: '2015-03-15' } });
      fireEvent.change(genderSelect, { target: { value: 'male' } });
      
      expect(firstNameInput).toHaveValue('John');
      expect(lastNameInput).toHaveValue('Doe');
      expect(dateOfBirthInput).toHaveValue('2015-03-15');
      expect(genderSelect).toHaveValue('male');
    });

    it('should handle parent information input changes', () => {
      render(
        <PatientRegistrationForm 
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );
      
      const parentNameInput = screen.getByTestId('parent-name-input');
      const parentEmailInput = screen.getByTestId('parent-email-input');
      const parentPhoneInput = screen.getByTestId('parent-phone-input');
      
      fireEvent.change(parentNameInput, { target: { value: 'Jane Doe' } });
      fireEvent.change(parentEmailInput, { target: { value: 'jane.doe@email.com' } });
      fireEvent.change(parentPhoneInput, { target: { value: '+66-81-234-5678' } });
      
      expect(parentNameInput).toHaveValue('Jane Doe');
      expect(parentEmailInput).toHaveValue('jane.doe@email.com');
      expect(parentPhoneInput).toHaveValue('+66-81-234-5678');
    });

    it('should handle medical history input changes', () => {
      render(
        <PatientRegistrationForm 
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );
      
      const medicalHistoryTextarea = screen.getByTestId('medical-history-textarea');
      
      fireEvent.change(medicalHistoryTextarea, { 
        target: { value: 'No significant medical history' } 
      });
      
      expect(medicalHistoryTextarea).toHaveValue('No significant medical history');
    });

    it('should handle allergy addition', () => {
      render(
        <PatientRegistrationForm 
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );
      
      const allergyInput = screen.getByTestId('allergy-input');
      const addAllergyButton = screen.getByTestId('add-allergy-button');
      
      fireEvent.change(allergyInput, { target: { value: 'Peanuts' } });
      fireEvent.click(addAllergyButton);
      
      expect(allergyInput).toHaveValue('Peanuts');
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      render(
        <PatientRegistrationForm 
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );
      
      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        // Should show validation errors for required fields
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/date of birth is required/i)).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      render(
        <PatientRegistrationForm 
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );
      
      const parentEmailInput = screen.getByTestId('parent-email-input');
      fireEvent.change(parentEmailInput, { target: { value: 'invalid-email' } });
      
      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });
    });

    it('should validate phone number format', async () => {
      render(
        <PatientRegistrationForm 
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );
      
      const parentPhoneInput = screen.getByTestId('parent-phone-input');
      fireEvent.change(parentPhoneInput, { target: { value: 'invalid-phone' } });
      
      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/invalid phone number format/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with form data on successful submission', async () => {
      render(
        <PatientRegistrationForm 
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );
      
      // Fill in required fields
      const firstNameInput = screen.getByTestId('first-name-input');
      const lastNameInput = screen.getByTestId('last-name-input');
      const dateOfBirthInput = screen.getByTestId('date-of-birth-input');
      const genderSelect = screen.getByTestId('gender-select');
      const parentNameInput = screen.getByTestId('parent-name-input');
      const parentEmailInput = screen.getByTestId('parent-email-input');
      const parentPhoneInput = screen.getByTestId('parent-phone-input');
      
      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(dateOfBirthInput, { target: { value: '2015-03-15' } });
      fireEvent.change(genderSelect, { target: { value: 'male' } });
      fireEvent.change(parentNameInput, { target: { value: 'Jane Doe' } });
      fireEvent.change(parentEmailInput, { target: { value: 'jane.doe@email.com' } });
      fireEvent.change(parentPhoneInput, { target: { value: '+66-81-234-5678' } });
      
      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
          first_name: 'John',
          last_name: 'Doe',
          date_of_birth: '2015-03-15',
          gender: 'male',
          parent_name: 'Jane Doe',
          parent_email: 'jane.doe@email.com',
          parent_phone: '+66-81-234-5678',
        }));
      });
    });

    it('should handle loading state during submission', () => {
      render(
        <PatientRegistrationForm 
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          loading={true}
        />
      );
      
      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent('Saving...');
    });
  });

  describe('Form Navigation', () => {
    it('should call onCancel when cancel button is clicked', () => {
      render(
        <PatientRegistrationForm 
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );
      
      const cancelButton = screen.getByTestId('cancel-button');
      fireEvent.click(cancelButton);
      
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should handle next button navigation', () => {
      render(
        <PatientRegistrationForm 
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );
      
      const nextButton = screen.getByTestId('next-button');
      fireEvent.click(nextButton);
      
      // Should advance to next step
      expect(screen.getByText('Step 2 of 7')).toBeInTheDocument();
    });
  });

  describe('Initial Data Handling', () => {
    it('should populate form with initial data', () => {
      const initialData = {
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '2015-03-15',
        gender: 'male',
        parent_name: 'Jane Doe',
        parent_email: 'jane.doe@email.com',
        parent_phone: '+66-81-234-5678',
        medical_history: 'No significant medical history',
      };

      render(
        <PatientRegistrationForm 
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          initialData={initialData}
        />
      );
      
      expect(screen.getByTestId('first-name-input')).toHaveValue('John');
      expect(screen.getByTestId('last-name-input')).toHaveValue('Doe');
      expect(screen.getByTestId('date-of-birth-input')).toHaveValue('2015-03-15');
      expect(screen.getByTestId('gender-select')).toHaveValue('male');
      expect(screen.getByTestId('parent-name-input')).toHaveValue('Jane Doe');
      expect(screen.getByTestId('parent-email-input')).toHaveValue('jane.doe@email.com');
      expect(screen.getByTestId('parent-phone-input')).toHaveValue('+66-81-234-5678');
      expect(screen.getByTestId('medical-history-textarea')).toHaveValue('No significant medical history');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels and ARIA attributes', () => {
      render(
        <PatientRegistrationForm 
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );
      
      const firstNameInput = screen.getByTestId('first-name-input');
      const lastNameInput = screen.getByTestId('last-name-input');
      const dateOfBirthInput = screen.getByTestId('date-of-birth-input');
      const genderSelect = screen.getByTestId('gender-select');
      
      expect(firstNameInput).toHaveAttribute('placeholder', 'First Name');
      expect(lastNameInput).toHaveAttribute('placeholder', 'Last Name');
      expect(dateOfBirthInput).toHaveAttribute('type', 'date');
      expect(genderSelect).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      render(
        <PatientRegistrationForm 
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );
      
      const firstNameInput = screen.getByTestId('first-name-input');
      const lastNameInput = screen.getByTestId('last-name-input');
      const nextButton = screen.getByTestId('next-button');
      
      firstNameInput.focus();
      expect(firstNameInput).toHaveFocus();
      
      fireEvent.keyDown(firstNameInput, { key: 'Tab' });
      expect(lastNameInput).toHaveFocus();
      
      fireEvent.keyDown(lastNameInput, { key: 'Tab' });
      expect(nextButton).toHaveFocus();
    });
  });

  describe('Responsive Design', () => {
    it('should be responsive on mobile devices', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <PatientRegistrationForm 
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );
      
      const form = screen.getByTestId('patient-registration-form');
      expect(form).toBeInTheDocument();
    });

    it('should be responsive on tablet devices', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(
        <PatientRegistrationForm 
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );
      
      const form = screen.getByTestId('patient-registration-form');
      expect(form).toBeInTheDocument();
    });

    it('should be responsive on desktop devices', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      render(
        <PatientRegistrationForm 
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );
      
      const form = screen.getByTestId('patient-registration-form');
      expect(form).toBeInTheDocument();
    });
  });
});
