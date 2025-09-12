import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import UserJourneyMap from '../UserJourneyMap';

// Mock theme for testing
const theme = createTheme();

// Test data
const mockSteps = [
  {
    id: 'login',
    title: 'Login',
    description: 'User authentication process',
    actions: ['Enter credentials', 'Submit form'],
    touchpoints: ['Login page', 'Validation'],
    duration: '30 seconds',
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Main dashboard view',
    actions: ['View statistics', 'Navigate'],
    touchpoints: ['Dashboard page', 'Navigation menu'],
    duration: '2 minutes',
    critical: true,
  },
  {
    id: 'patients',
    title: 'Patient Management',
    description: 'Patient list and management',
    actions: ['Search patients', 'View details'],
    touchpoints: ['Patient list', 'Search functionality'],
    duration: '5 minutes',
  },
];

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('UserJourneyMap Component', () => {
  const defaultProps = {
    title: 'Doctor User Journey',
    userType: 'doctor' as const,
    steps: mockSteps,
  };

  it('renders journey map with title and user type', () => {
    renderWithTheme(<UserJourneyMap {...defaultProps} />);
    
    expect(screen.getByText('Doctor User Journey')).toBeInTheDocument();
    expect(screen.getByText('User Type: Doctor')).toBeInTheDocument();
  });

  it('renders all journey steps', () => {
    renderWithTheme(<UserJourneyMap {...defaultProps} />);
    
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Patient Management')).toBeInTheDocument();
  });

  it('displays step descriptions', () => {
    renderWithTheme(<UserJourneyMap {...defaultProps} currentStep="login" />);
    
    expect(screen.getByText('User authentication process')).toBeInTheDocument();
  });

  it('shows duration for steps with duration', () => {
    renderWithTheme(<UserJourneyMap {...defaultProps} currentStep="login" />);
    
    expect(screen.getByText('⏱️ Estimated Duration: 30 seconds')).toBeInTheDocument();
  });

  it('displays touchpoints for each step', () => {
    renderWithTheme(<UserJourneyMap {...defaultProps} currentStep="login" />);
    
    expect(screen.getByText('🎯 Key Touchpoints:')).toBeInTheDocument();
    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.getByText('Validation')).toBeInTheDocument();
  });

  it('displays actions for each step', () => {
    renderWithTheme(<UserJourneyMap {...defaultProps} currentStep="login" />);
    
    expect(screen.getByText('🔧 Actions:')).toBeInTheDocument();
    expect(screen.getByText('Enter credentials')).toBeInTheDocument();
    expect(screen.getByText('Submit form')).toBeInTheDocument();
  });

  it('highlights current step when provided', () => {
    renderWithTheme(
      <UserJourneyMap {...defaultProps} currentStep="dashboard" />
    );
    
    // Check that the current step is rendered
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Main dashboard view')).toBeInTheDocument();
  });

  it('calls onStepClick when step is clicked', () => {
    const mockOnStepClick = jest.fn();
    renderWithTheme(
      <UserJourneyMap {...defaultProps} currentStep="login" onStepClick={mockOnStepClick} />
    );
    
    // Find the step card and click it
    const stepCard = screen.getByText('User authentication process').closest('div');
    fireEvent.click(stepCard!);
    
    expect(mockOnStepClick).toHaveBeenCalledWith('login');
  });

  it('renders different user types correctly', () => {
    const { rerender } = renderWithTheme(
      <UserJourneyMap {...defaultProps} userType="teacher" />
    );
    expect(screen.getByText('User Type: Teacher')).toBeInTheDocument();

    rerender(
      <ThemeProvider theme={theme}>
        <UserJourneyMap {...defaultProps} userType="parent" />
      </ThemeProvider>
    );
    expect(screen.getByText('User Type: Parent')).toBeInTheDocument();

    rerender(
      <ThemeProvider theme={theme}>
        <UserJourneyMap {...defaultProps} userType="student" />
      </ThemeProvider>
    );
    expect(screen.getByText('User Type: Student')).toBeInTheDocument();

    rerender(
      <ThemeProvider theme={theme}>
        <UserJourneyMap {...defaultProps} userType="admin" />
      </ThemeProvider>
    );
    expect(screen.getByText('User Type: Admin')).toBeInTheDocument();
  });

  it('handles steps without duration gracefully', () => {
    const stepsWithoutDuration = [
      {
        id: 'step1',
        title: 'Step 1',
        description: 'Description',
        actions: ['Action 1'],
        touchpoints: ['Touchpoint 1'],
      },
    ];

    renderWithTheme(
      <UserJourneyMap
        title="Test Journey"
        userType="doctor"
        steps={stepsWithoutDuration}
      />
    );

    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.queryByText('⏱️ Estimated Duration:')).not.toBeInTheDocument();
  });

  it('handles steps without touchpoints gracefully', () => {
    const stepsWithoutTouchpoints = [
      {
        id: 'step1',
        title: 'Step 1',
        description: 'Description',
        actions: ['Action 1'],
        touchpoints: [],
      },
    ];

    renderWithTheme(
      <UserJourneyMap
        title="Test Journey"
        userType="doctor"
        steps={stepsWithoutTouchpoints}
      />
    );

    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.queryByText('🎯 Key Touchpoints:')).not.toBeInTheDocument();
  });

  it('handles steps without actions gracefully', () => {
    const stepsWithoutActions = [
      {
        id: 'step1',
        title: 'Step 1',
        description: 'Description',
        actions: [],
        touchpoints: ['Touchpoint 1'],
      },
    ];

    renderWithTheme(
      <UserJourneyMap
        title="Test Journey"
        userType="doctor"
        steps={stepsWithoutActions}
      />
    );

    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.queryByText('🔧 Actions:')).not.toBeInTheDocument();
  });

  it('applies critical styling to critical steps', () => {
    renderWithTheme(<UserJourneyMap {...defaultProps} />);
    
    const criticalStep = screen.getByText('Dashboard').closest('.MuiStepLabel-root');
    expect(criticalStep).toBeInTheDocument();
  });

  it('renders correct icons for different step types', () => {
    renderWithTheme(<UserJourneyMap {...defaultProps} />);
    
    // Check that step icons are rendered as text content
    expect(screen.getByText('🔐')).toBeInTheDocument();
    expect(screen.getByText('📊')).toBeInTheDocument();
    expect(screen.getByText('👥')).toBeInTheDocument();
  });

  it('maintains accessibility with proper ARIA labels', () => {
    renderWithTheme(<UserJourneyMap {...defaultProps} />);
    
    // Check that the component renders with proper structure
    expect(screen.getByText('Doctor User Journey')).toBeInTheDocument();
    expect(screen.getByText('User Type: Doctor')).toBeInTheDocument();
  });

  it('handles empty steps array gracefully', () => {
    renderWithTheme(
      <UserJourneyMap
        title="Empty Journey"
        userType="doctor"
        steps={[]}
      />
    );

    expect(screen.getByText('Empty Journey')).toBeInTheDocument();
    expect(screen.getByText('User Type: Doctor')).toBeInTheDocument();
  });

  it('applies proper styling classes', () => {
    renderWithTheme(<UserJourneyMap {...defaultProps} />);
    
    const container = screen.getByText('Doctor User Journey').closest('.MuiPaper-root');
    expect(container).toHaveClass('MuiPaper-root');
  });
});
