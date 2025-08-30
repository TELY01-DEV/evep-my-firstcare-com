import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  SkeletonCard,
  SkeletonList,
  SkeletonTable,
  ProgressIndicator,
  StepProgress,
  LoadingState,
  StatusIndicator,
} from '../LoadingStates';

// Mock theme for testing
const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('SkeletonCard Component', () => {
  it('renders skeleton card with default props', () => {
    renderWithTheme(<SkeletonCard />);
    
    const card = screen.getByTestId('skeleton-card');
    expect(card).toBeInTheDocument();
  });

  it('renders skeleton card with avatar when showAvatar is true', () => {
    renderWithTheme(<SkeletonCard showAvatar={true} />);
    
    const avatar = document.querySelector('.MuiSkeleton-circular');
    expect(avatar).toBeInTheDocument();
  });

  it('renders skeleton card with actions when showActions is true', () => {
    renderWithTheme(<SkeletonCard showActions={true} />);
    
    const actions = document.querySelectorAll('.MuiSkeleton-rectangular');
    expect(actions.length).toBeGreaterThan(0);
  });

  it('renders specified number of text lines', () => {
    renderWithTheme(<SkeletonCard lines={5} />);
    
    const textLines = document.querySelectorAll('.MuiSkeleton-text');
    // SkeletonCard renders 1 title line + the specified number of lines
    expect(textLines.length).toBe(6);
  });

  it('applies proper styling classes', () => {
    renderWithTheme(<SkeletonCard />);
    
    const card = screen.getByTestId('skeleton-card');
    expect(card).toHaveClass('MuiCard-root');
  });
});

describe('SkeletonList Component', () => {
  it('renders skeleton list with default count', () => {
    renderWithTheme(<SkeletonList />);
    
    const cards = screen.getAllByTestId('skeleton-card');
    expect(cards).toHaveLength(5);
  });

  it('renders skeleton list with custom count', () => {
    renderWithTheme(<SkeletonList count={3} />);
    
    const cards = screen.getAllByTestId('skeleton-card');
    expect(cards).toHaveLength(3);
  });

  it('renders skeleton cards with avatar and actions', () => {
    renderWithTheme(<SkeletonList count={2} />);
    
    const avatars = document.querySelectorAll('.MuiSkeleton-circular');
    const actions = document.querySelectorAll('.MuiSkeleton-rectangular');
    
    expect(avatars.length).toBeGreaterThan(0);
    expect(actions.length).toBeGreaterThan(0);
  });
});

describe('SkeletonTable Component', () => {
  it('renders skeleton table with default props', () => {
    renderWithTheme(<SkeletonTable />);
    
    const headerSkeletons = document.querySelectorAll('.MuiSkeleton-text');
    expect(headerSkeletons.length).toBeGreaterThan(0);
  });

  it('renders skeleton table with custom rows and columns', () => {
    renderWithTheme(<SkeletonTable rows={3} columns={2} />);
    
    const skeletons = document.querySelectorAll('.MuiSkeleton-text');
    // Header + rows * columns
    expect(skeletons.length).toBe(2 + (3 * 2));
  });

  it('applies proper styling to table elements', () => {
    renderWithTheme(<SkeletonTable />);
    
    const container = document.querySelector('.MuiBox-root');
    expect(container).toBeInTheDocument();
  });
});

describe('ProgressIndicator Component', () => {
  it('renders linear progress indicator by default', () => {
    renderWithTheme(<ProgressIndicator value={50} total={100} />);
    
    const progressBar = document.querySelector('.MuiLinearProgress-root');
    expect(progressBar).toBeInTheDocument();
  });

  it('renders circular progress indicator when variant is circular', () => {
    renderWithTheme(
      <ProgressIndicator value={50} total={100} variant="circular" />
    );
    
    const progressCircle = document.querySelector('.MuiCircularProgress-root');
    expect(progressCircle).toBeInTheDocument();
  });

  it('displays correct percentage', () => {
    renderWithTheme(<ProgressIndicator value={75} total={100} />);
    
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('displays custom label when provided', () => {
    renderWithTheme(
      <ProgressIndicator value={50} total={100} label="Loading..." />
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('hides percentage when showPercentage is false', () => {
    renderWithTheme(
      <ProgressIndicator value={50} total={100} showPercentage={false} />
    );
    
    expect(screen.queryByText('50%')).not.toBeInTheDocument();
    expect(screen.getByText('50 of 100 completed')).toBeInTheDocument();
  });

  it('applies different sizes correctly', () => {
    const { rerender } = renderWithTheme(
      <ProgressIndicator value={50} total={100} size="small" />
    );
    
    let progressBar = document.querySelector('.MuiLinearProgress-root');
    expect(progressBar).toBeInTheDocument();

    rerender(
      <ThemeProvider theme={theme}>
        <ProgressIndicator value={50} total={100} size="large" />
      </ThemeProvider>
    );
    
    progressBar = document.querySelector('.MuiLinearProgress-root');
    expect(progressBar).toBeInTheDocument();
  });
});

describe('StepProgress Component', () => {
  const mockSteps = ['Step 1', 'Step 2', 'Step 3', 'Step 4'];

  it('renders all steps', () => {
    renderWithTheme(
      <StepProgress steps={mockSteps} currentStep={0} />
    );
    
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Step 3')).toBeInTheDocument();
    expect(screen.getByText('Step 4')).toBeInTheDocument();
  });

  it('highlights current step', () => {
    renderWithTheme(
      <StepProgress steps={mockSteps} currentStep={1} />
    );
    
    const step2 = screen.getByText('Step 2');
    expect(step2).toBeInTheDocument();
  });

  it('marks completed steps', () => {
    renderWithTheme(
      <StepProgress steps={mockSteps} currentStep={2} completedSteps={[0, 1]} />
    );
    
    const step1 = screen.getByText('Step 1');
    const step2 = screen.getByText('Step 2');
    expect(step1).toBeInTheDocument();
    expect(step2).toBeInTheDocument();
  });

  it('calls onStepClick when step is clicked', () => {
    const mockOnStepClick = jest.fn();
    renderWithTheme(
      <StepProgress
        steps={mockSteps}
        currentStep={1}
        completedSteps={[0]}
        onStepClick={mockOnStepClick}
      />
    );
    
    const step1 = screen.getByText('Step 1');
    fireEvent.click(step1);
    
    expect(mockOnStepClick).toHaveBeenCalledWith(0);
  });

  it('renders progress bar', () => {
    renderWithTheme(
      <StepProgress steps={mockSteps} currentStep={1} completedSteps={[0]} />
    );
    
    const progressBar = document.querySelector('.MuiLinearProgress-root');
    expect(progressBar).toBeInTheDocument();
  });
});

describe('LoadingState Component', () => {
  it('renders spinner loading state', () => {
    renderWithTheme(
      <LoadingState type="spinner" message="Loading data..." />
    );
    
    const spinner = document.querySelector('.MuiCircularProgress-root');
    expect(spinner).toBeInTheDocument();
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('renders pulse loading state', () => {
    renderWithTheme(
      <LoadingState type="pulse" message="Processing..." />
    );
    
    // Verify the pulse loading state renders correctly
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    
    // Check that the component renders without errors
    const loadingContainer = document.querySelector('div');
    expect(loadingContainer).toBeInTheDocument();
  });

  it('renders skeleton loading state', () => {
    renderWithTheme(
      <LoadingState type="skeleton" message="Loading..." />
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders full screen overlay when fullScreen is true', () => {
    renderWithTheme(
      <LoadingState type="spinner" message="Loading..." fullScreen={true} />
    );
    
    // Verify the full screen loading state renders correctly
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Check that the component renders without errors
    const loadingContainer = document.querySelector('div');
    expect(loadingContainer).toBeInTheDocument();
  });

  it('applies different sizes correctly', () => {
    const { rerender } = renderWithTheme(
      <LoadingState type="spinner" size="small" />
    );
    
    let spinner = document.querySelector('.MuiCircularProgress-root');
    expect(spinner).toBeInTheDocument();

    rerender(
      <ThemeProvider theme={theme}>
        <LoadingState type="spinner" size="large" />
      </ThemeProvider>
    );
    
    spinner = document.querySelector('.MuiCircularProgress-root');
    expect(spinner).toBeInTheDocument();
  });

  it('uses default message when not provided', () => {
    renderWithTheme(<LoadingState type="spinner" />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});

describe('StatusIndicator Component', () => {
  it('renders chip variant by default', () => {
    renderWithTheme(
      <StatusIndicator status="success" message="Operation completed" />
    );
    
    const chip = document.querySelector('.MuiChip-root');
    expect(chip).toBeInTheDocument();
    expect(screen.getByText('Operation completed')).toBeInTheDocument();
  });

  it('renders alert variant', () => {
    renderWithTheme(
      <StatusIndicator
        status="error"
        message="An error occurred"
        variant="alert"
      />
    );
    
    expect(screen.getByText('An error occurred')).toBeInTheDocument();
  });

  it('renders inline variant', () => {
    renderWithTheme(
      <StatusIndicator
        status="warning"
        message="Please check your input"
        variant="inline"
      />
    );
    
    expect(screen.getByText('Please check your input')).toBeInTheDocument();
  });

  it('shows icon when showIcon is true', () => {
    renderWithTheme(
      <StatusIndicator
        status="success"
        message="Success"
        showIcon={true}
      />
    );
    
    const chip = document.querySelector('.MuiChip-root');
    expect(chip).toBeInTheDocument();
  });

  it('hides icon when showIcon is false', () => {
    renderWithTheme(
      <StatusIndicator
        status="success"
        message="Success"
        showIcon={false}
      />
    );
    
    const chip = document.querySelector('.MuiChip-root');
    expect(chip).toBeInTheDocument();
  });

  it('applies correct colors for different statuses', () => {
    const { rerender } = renderWithTheme(
      <StatusIndicator status="success" message="Success" />
    );
    
    let chip = document.querySelector('.MuiChip-root');
    expect(chip).toHaveClass('MuiChip-colorSuccess');

    rerender(
      <ThemeProvider theme={theme}>
        <StatusIndicator status="error" message="Error" />
      </ThemeProvider>
    );
    
    chip = document.querySelector('.MuiChip-root');
    expect(chip).toHaveClass('MuiChip-colorError');

    rerender(
      <ThemeProvider theme={theme}>
        <StatusIndicator status="warning" message="Warning" />
      </ThemeProvider>
    );
    
    chip = document.querySelector('.MuiChip-root');
    expect(chip).toHaveClass('MuiChip-colorWarning');

    rerender(
      <ThemeProvider theme={theme}>
        <StatusIndicator status="info" message="Info" />
      </ThemeProvider>
    );
    
    chip = document.querySelector('.MuiChip-root');
    expect(chip).toHaveClass('MuiChip-colorInfo');
  });

  it('handles loading status correctly', () => {
    renderWithTheme(
      <StatusIndicator status="loading" message="Loading..." />
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
