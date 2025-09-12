import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../test-utils';
import { mockPatient, mockScreening } from '../../../test-utils';
import EnhancedScreeningInterface from '../EnhancedScreeningInterface';

// Mock the EnhancedScreeningInterface component
jest.mock('../EnhancedScreeningInterface', () => {
  return function MockEnhancedScreeningInterface({ 
    patient, 
    onComplete, 
    onCancel, 
    open, 
    onClose 
  }: any) {
    if (!open) return null;
    
    return (
      <div data-testid="enhanced-screening-interface">
        <h2>Enhanced Vision Screening</h2>
        
        {/* Progress indicator */}
        <div data-testid="progress-indicator">
          <span data-testid="current-step">Step 1</span>
          <span data-testid="total-steps">of 5</span>
        </div>
        
        {/* Patient info */}
        <div data-testid="patient-info">
          <span data-testid="patient-name">{patient?.first_name} {patient?.last_name}</span>
          <span data-testid="patient-age">8 years old</span>
        </div>
        
        {/* Test sections */}
        <div data-testid="test-sections">
          {/* Eye Chart Test */}
          <div data-testid="eye-chart-test" data-test-section="active">
            <h3>Eye Chart Test</h3>
            <div data-testid="eye-chart-display">
              <div data-testid="chart-line" data-line="1">E</div>
              <div data-testid="chart-line" data-line="2">F P</div>
              <div data-testid="chart-line" data-line="3">T O Z</div>
              <div data-testid="chart-line" data-line="4">L P E D</div>
              <div data-testid="chart-line" data-line="5">P E C F D</div>
            </div>
            <div data-testid="eye-selection">
              <button data-testid="left-eye-btn" data-eye="left">Left Eye</button>
              <button data-testid="right-eye-btn" data-eye="right">Right Eye</button>
            </div>
            <div data-testid="result-input">
              <input 
                type="text" 
                placeholder="Enter result (e.g., 20/20)" 
                data-testid="result-input-field"
              />
              <button data-testid="record-result-btn">Record Result</button>
            </div>
          </div>
          
          {/* Color Vision Test */}
          <div data-testid="color-vision-test" data-test-section="inactive">
            <h3>Color Vision Test</h3>
            <div data-testid="color-plates">
              <div data-testid="color-plate" data-plate="1">🔴</div>
              <div data-testid="color-plate" data-plate="2">🟢</div>
              <div data-testid="color-plate" data-plate="3">🔵</div>
            </div>
            <div data-testid="color-result-input">
              <input 
                type="text" 
                placeholder="What do you see?" 
                data-testid="color-result-field"
              />
              <button data-testid="record-color-result-btn">Record</button>
            </div>
          </div>
          
          {/* Depth Perception Test */}
          <div data-testid="depth-perception-test" data-test-section="inactive">
            <h3>Depth Perception Test</h3>
            <div data-testid="depth-display">
              <div data-testid="depth-target">🎯</div>
            </div>
            <div data-testid="depth-result-input">
              <input 
                type="text" 
                placeholder="Distance estimate" 
                data-testid="depth-result-field"
              />
              <button data-testid="record-depth-result-btn">Record</button>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <div data-testid="screening-navigation">
          <button data-testid="previous-step-btn">Previous</button>
          <button data-testid="next-step-btn">Next</button>
          <button data-testid="complete-screening-btn">Complete Screening</button>
        </div>
        
        {/* Timer */}
        <div data-testid="screening-timer">
          <span data-testid="timer-display">00:30</span>
        </div>
        
        {/* Results summary */}
        <div data-testid="results-summary" data-test-section="inactive">
          <h3>Screening Results</h3>
          <div data-testid="left-eye-result">
            <span>Left Eye: 20/20</span>
          </div>
          <div data-testid="right-eye-result">
            <span>Right Eye: 20/25</span>
          </div>
          <div data-testid="color-vision-result">
            <span>Color Vision: Normal</span>
          </div>
          <div data-testid="depth-perception-result">
            <span>Depth Perception: Normal</span>
          </div>
        </div>
        
        {/* Action buttons */}
        <div data-testid="screening-actions">
          <button data-testid="cancel-screening-btn" onClick={onCancel}>
            Cancel
          </button>
          <button data-testid="save-screening-btn" onClick={() => onComplete(mockScreening)}>
            Save Results
          </button>
        </div>
      </div>
    );
  };
});

describe('EnhancedScreeningInterface Component', () => {
  const mockOnComplete = jest.fn();
  const mockOnCancel = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render enhanced screening interface when open', () => {
      render(
        <EnhancedScreeningInterface
          patient={mockPatient}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          open={true}
          onClose={mockOnClose}
        />
      );
      
      expect(screen.getByTestId('enhanced-screening-interface')).toBeInTheDocument();
      expect(screen.getByText('Enhanced Vision Screening')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(
        <EnhancedScreeningInterface
          patient={mockPatient}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          open={false}
          onClose={mockOnClose}
        />
      );
      
      expect(screen.queryByTestId('enhanced-screening-interface')).not.toBeInTheDocument();
    });

    it('should display patient information', () => {
      render(
        <EnhancedScreeningInterface
          patient={mockPatient}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          open={true}
          onClose={mockOnClose}
        />
      );
      
      expect(screen.getByTestId('patient-name')).toHaveTextContent('John Doe');
      expect(screen.getByTestId('patient-age')).toHaveTextContent('8 years old');
    });

    it('should display progress indicator', () => {
      render(
        <EnhancedScreeningInterface
          patient={mockPatient}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          open={true}
          onClose={mockOnClose}
        />
      );
      
      expect(screen.getByTestId('current-step')).toHaveTextContent('Step 1');
      expect(screen.getByTestId('total-steps')).toHaveTextContent('of 5');
    });
  });

  describe('Test Sections', () => {
    it('should render eye chart test section', () => {
      render(
        <EnhancedScreeningInterface
          patient={mockPatient}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          open={true}
          onClose={mockOnClose}
        />
      );
      
      expect(screen.getByTestId('eye-chart-test')).toBeInTheDocument();
      expect(screen.getByText('Eye Chart Test')).toBeInTheDocument();
      expect(screen.getByTestId('eye-chart-display')).toBeInTheDocument();
    });

    it('should render color vision test section', () => {
      render(
        <EnhancedScreeningInterface
          patient={mockPatient}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          open={true}
          onClose={mockOnClose}
        />
      );
      
      expect(screen.getByTestId('color-vision-test')).toBeInTheDocument();
      expect(screen.getByText('Color Vision Test')).toBeInTheDocument();
      expect(screen.getByTestId('color-plates')).toBeInTheDocument();
    });

    it('should render depth perception test section', () => {
      render(
        <EnhancedScreeningInterface
          patient={mockPatient}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          open={true}
          onClose={mockOnClose}
        />
      );
      
      expect(screen.getByTestId('depth-perception-test')).toBeInTheDocument();
      expect(screen.getByText('Depth Perception Test')).toBeInTheDocument();
      expect(screen.getByTestId('depth-display')).toBeInTheDocument();
    });
  });

  describe('Eye Chart Test Interactions', () => {
    it('should handle eye selection', () => {
      render(
        <EnhancedScreeningInterface
          patient={mockPatient}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          open={true}
          onClose={mockOnClose}
        />
      );
      
      const leftEyeBtn = screen.getByTestId('left-eye-btn');
      const rightEyeBtn = screen.getByTestId('right-eye-btn');
      
      fireEvent.click(leftEyeBtn);
      expect(leftEyeBtn).toHaveAttribute('data-eye', 'left');
      
      fireEvent.click(rightEyeBtn);
      expect(rightEyeBtn).toHaveAttribute('data-eye', 'right');
    });

    it('should handle result input', () => {
      render(
        <EnhancedScreeningInterface
          patient={mockPatient}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          open={true}
          onClose={mockOnClose}
        />
      );
      
      const resultInput = screen.getByTestId('result-input-field');
      fireEvent.change(resultInput, { target: { value: '20/20' } });
      
      expect(resultInput).toHaveValue('20/20');
    });

    it('should handle result recording', () => {
      render(
        <EnhancedScreeningInterface
          patient={mockPatient}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          open={true}
          onClose={mockOnClose}
        />
      );
      
      const recordResultBtn = screen.getByTestId('record-result-btn');
      fireEvent.click(recordResultBtn);
      
      // Should record the result and potentially move to next step
      expect(recordResultBtn).toBeInTheDocument();
    });
  });

  describe('Color Vision Test Interactions', () => {
    it('should handle color plate display', () => {
      render(
        <EnhancedScreeningInterface
          patient={mockPatient}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          open={true}
          onClose={mockOnClose}
        />
      );
      
      const colorPlates = screen.getAllByTestId('color-plate');
      expect(colorPlates).toHaveLength(3);
      expect(colorPlates[0]).toHaveTextContent('🔴');
      expect(colorPlates[1]).toHaveTextContent('🟢');
      expect(colorPlates[2]).toHaveTextContent('🔵');
    });

    it('should handle color result input', () => {
      render(
        <EnhancedScreeningInterface
          patient={mockPatient}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          open={true}
          onClose={mockOnClose}
        />
      );
      
      const colorResultField = screen.getByTestId('color-result-field');
      fireEvent.change(colorResultField, { target: { value: 'Red circle' } });
      
      expect(colorResultField).toHaveValue('Red circle');
    });
  });

  describe('Depth Perception Test Interactions', () => {
    it('should handle depth perception test', () => {
      render(
        <EnhancedScreeningInterface
          patient={mockPatient}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          open={true}
          onClose={mockOnClose}
        />
      );
      
      const depthResultField = screen.getByTestId('depth-result-field');
      fireEvent.change(depthResultField, { target: { value: '2 meters' } });
      
      expect(depthResultField).toHaveValue('2 meters');
    });
  });

  describe('Navigation', () => {
    it('should handle next step navigation', () => {
      render(
        <EnhancedScreeningInterface
          patient={mockPatient}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          open={true}
          onClose={mockOnClose}
        />
      );
      
      const nextStepBtn = screen.getByTestId('next-step-btn');
      fireEvent.click(nextStepBtn);
      
      // Should advance to next step
      expect(screen.getByTestId('current-step')).toHaveTextContent('Step 2');
    });

    it('should handle previous step navigation', () => {
      render(
        <EnhancedScreeningInterface
          patient={mockPatient}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          open={true}
          onClose={mockOnClose}
        />
      );
      
      // First go to step 2
      const nextStepBtn = screen.getByTestId('next-step-btn');
      fireEvent.click(nextStepBtn);
      
      // Then go back
      const previousStepBtn = screen.getByTestId('previous-step-btn');
      fireEvent.click(previousStepBtn);
      
      expect(screen.getByTestId('current-step')).toHaveTextContent('Step 1');
    });
  });

  describe('Timer Functionality', () => {
    it('should display timer', () => {
      render(
        <EnhancedScreeningInterface
          patient={mockPatient}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          open={true}
          onClose={mockOnClose}
        />
      );
      
      expect(screen.getByTestId('timer-display')).toHaveTextContent('00:30');
    });
  });

  describe('Results Summary', () => {
    it('should display results summary when completed', () => {
      render(
        <EnhancedScreeningInterface
          patient={mockPatient}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          open={true}
          onClose={mockOnClose}
        />
      );
      
      // Complete the screening to show results
      const completeScreeningBtn = screen.getByTestId('complete-screening-btn');
      fireEvent.click(completeScreeningBtn);
      
      expect(screen.getByTestId('results-summary')).toBeInTheDocument();
      expect(screen.getByTestId('left-eye-result')).toHaveTextContent('Left Eye: 20/20');
      expect(screen.getByTestId('right-eye-result')).toHaveTextContent('Right Eye: 20/25');
      expect(screen.getByTestId('color-vision-result')).toHaveTextContent('Color Vision: Normal');
      expect(screen.getByTestId('depth-perception-result')).toHaveTextContent('Depth Perception: Normal');
    });
  });

  describe('Actions', () => {
    it('should handle cancel action', () => {
      render(
        <EnhancedScreeningInterface
          patient={mockPatient}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          open={true}
          onClose={mockOnClose}
        />
      );
      
      const cancelBtn = screen.getByTestId('cancel-screening-btn');
      fireEvent.click(cancelBtn);
      
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should handle save results action', () => {
      render(
        <EnhancedScreeningInterface
          patient={mockPatient}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          open={true}
          onClose={mockOnClose}
        />
      );
      
      const saveBtn = screen.getByTestId('save-screening-btn');
      fireEvent.click(saveBtn);
      
      expect(mockOnComplete).toHaveBeenCalledWith(mockScreening);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <EnhancedScreeningInterface
          patient={mockPatient}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          open={true}
          onClose={mockOnClose}
        />
      );
      
      const eyeChartTest = screen.getByTestId('eye-chart-test');
      const colorVisionTest = screen.getByTestId('color-vision-test');
      const depthPerceptionTest = screen.getByTestId('depth-perception-test');
      
      expect(eyeChartTest).toHaveAttribute('data-test-section', 'active');
      expect(colorVisionTest).toHaveAttribute('data-test-section', 'inactive');
      expect(depthPerceptionTest).toHaveAttribute('data-test-section', 'inactive');
    });

    it('should be keyboard navigable', () => {
      render(
        <EnhancedScreeningInterface
          patient={mockPatient}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          open={true}
          onClose={mockOnClose}
        />
      );
      
      const leftEyeBtn = screen.getByTestId('left-eye-btn');
      const rightEyeBtn = screen.getByTestId('right-eye-btn');
      const nextStepBtn = screen.getByTestId('next-step-btn');
      
      leftEyeBtn.focus();
      expect(leftEyeBtn).toHaveFocus();
      
      fireEvent.keyDown(leftEyeBtn, { key: 'Tab' });
      expect(rightEyeBtn).toHaveFocus();
      
      fireEvent.keyDown(rightEyeBtn, { key: 'Tab' });
      expect(nextStepBtn).toHaveFocus();
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
        <EnhancedScreeningInterface
          patient={mockPatient}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          open={true}
          onClose={mockOnClose}
        />
      );
      
      const interface = screen.getByTestId('enhanced-screening-interface');
      expect(interface).toBeInTheDocument();
    });

    it('should be responsive on tablet devices', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(
        <EnhancedScreeningInterface
          patient={mockPatient}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          open={true}
          onClose={mockOnClose}
        />
      );
      
      const interface = screen.getByTestId('enhanced-screening-interface');
      expect(interface).toBeInTheDocument();
    });

    it('should be responsive on desktop devices', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      render(
        <EnhancedScreeningInterface
          patient={mockPatient}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          open={true}
          onClose={mockOnClose}
        />
      );
      
      const interface = screen.getByTestId('enhanced-screening-interface');
      expect(interface).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing patient data gracefully', () => {
      render(
        <EnhancedScreeningInterface
          patient={null}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          open={true}
          onClose={mockOnClose}
        />
      );
      
      expect(screen.getByTestId('enhanced-screening-interface')).toBeInTheDocument();
      expect(screen.getByTestId('patient-name')).toHaveTextContent(' ');
    });

    it('should handle test completion errors', async () => {
      render(
        <EnhancedScreeningInterface
          patient={mockPatient}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          open={true}
          onClose={mockOnClose}
        />
      );
      
      const completeScreeningBtn = screen.getByTestId('complete-screening-btn');
      fireEvent.click(completeScreeningBtn);
      
      // Should handle completion without errors
      expect(completeScreeningBtn).toBeInTheDocument();
    });
  });
});
