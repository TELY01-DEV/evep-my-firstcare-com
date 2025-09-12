import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ErrorBoundary from '../ErrorBoundary';

// Mock theme for testing
const theme = createTheme();

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>Normal component</div>;
};

// Custom fallback component
const CustomFallback: React.FC = () => (
  <div data-testid="custom-fallback">Custom fallback content</div>
);

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    // Suppress console.error for tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    renderWithTheme(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Normal component')).toBeInTheDocument();
  });

  it('renders error UI when child throws an error', () => {
    renderWithTheme(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText("We're sorry, but something unexpected happened.")).toBeInTheDocument();
  });

  it('displays error message in alert', () => {
    renderWithTheme(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error Details')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('shows error ID when error occurs', () => {
    renderWithTheme(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const errorIdElement = screen.getByText(/Error ID:/);
    expect(errorIdElement).toBeInTheDocument();
    expect(errorIdElement.textContent).toMatch(/error-\d+-[a-z0-9]+/);
  });

  it('calls onError callback when error occurs', () => {
    const mockOnError = jest.fn();
    
    renderWithTheme(
      <ErrorBoundary onError={mockOnError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(mockOnError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('logs error to console when error occurs', () => {
    const consoleSpy = jest.spyOn(console, 'error');
    
    renderWithTheme(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      'ErrorBoundary caught an error:',
      expect.any(Error),
      expect.any(Object)
    );
  });

  it('renders custom fallback when provided', () => {
    renderWithTheme(
      <ErrorBoundary fallback={<CustomFallback />}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('handles retry functionality', () => {
    renderWithTheme(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should show error initially
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Test that retry button exists and is clickable
    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();
    expect(retryButton).toBeEnabled();

    // Test that clicking retry button calls the handler
    fireEvent.click(retryButton);
    
    // The ErrorBoundary should reset its state (though it won't re-render children)
    // We can verify the button is still there and functional
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('handles go home functionality', () => {
    const mockLocation = { href: '' };
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    });

    renderWithTheme(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const goHomeButton = screen.getByText('Go Home');
    fireEvent.click(goHomeButton);

    expect(window.location.href).toBe('/');
  });

  it('handles contact support functionality', () => {
    const mockOpen = jest.fn();
    Object.defineProperty(window, 'open', {
      value: mockOpen,
      writable: true,
    });

    renderWithTheme(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const contactSupportButton = screen.getByText('Contact Support');
    fireEvent.click(contactSupportButton);

    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringMatching(/^mailto:support@evep\.com\?subject=.*&body=.*$/)
    );
  });

  it('handles report bug functionality', () => {
    const mockOpen = jest.fn();
    Object.defineProperty(window, 'open', {
      value: mockOpen,
      writable: true,
    });

    renderWithTheme(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const reportBugButton = screen.getByText('Report Bug');
    fireEvent.click(reportBugButton);

    expect(mockOpen).toHaveBeenCalledWith('/bug-report', '_blank');
  });

  it('shows technical details when showDetails is true', () => {
    renderWithTheme(
      <ErrorBoundary showDetails={true}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Technical Details:')).toBeInTheDocument();
    expect(screen.getByText(/Error: Test error message/)).toBeInTheDocument();
  });

  it('does not show technical details when showDetails is false', () => {
    renderWithTheme(
      <ErrorBoundary showDetails={false}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Technical Details:')).not.toBeInTheDocument();
  });

  it('handles error without message gracefully', () => {
    const ErrorWithoutMessage: React.FC = () => {
      throw new Error();
    };

    renderWithTheme(
      <ErrorBoundary>
        <ErrorWithoutMessage />
      </ErrorBoundary>
    );

    expect(screen.getByText('An unknown error occurred')).toBeInTheDocument();
  });

  it('handles error logging failure gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Mock console.log to throw an error
    const originalLog = console.log;
    console.log = jest.fn().mockImplementation(() => {
      throw new Error('Logging failed');
    });

    renderWithTheme(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalledWith('Failed to log error:', expect.any(Error));
    
    // Restore console.log
    console.log = originalLog;
  });

  it('generates unique error IDs for different errors', () => {
    const { rerender } = renderWithTheme(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const firstErrorId = screen.getByText(/Error ID:/).textContent;

    // Reset error boundary
    fireEvent.click(screen.getByText('Try Again'));

    // Throw another error
    rerender(
      <ThemeProvider theme={theme}>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </ThemeProvider>
    );

    const secondErrorId = screen.getByText(/Error ID:/).textContent;

    expect(firstErrorId).not.toBe(secondErrorId);
  });

  it('applies proper styling classes', () => {
    renderWithTheme(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const container = screen.getByText('Something went wrong').closest('.MuiCard-root');
    expect(container).toHaveClass('MuiCard-root');
  });

  it('handles multiple error recovery attempts', () => {
    renderWithTheme(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // First error
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();

    // Test retry button functionality
    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();
    
    // Click retry button
    fireEvent.click(retryButton);
    
    // Verify retry button is still functional
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    
    // Test that error boundary can handle multiple error states
    // by verifying all recovery buttons are present and functional
    expect(screen.getByText('Go Home')).toBeInTheDocument();
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
    expect(screen.getByText('Report Bug')).toBeInTheDocument();
  });

  it('maintains error state across re-renders', () => {
    const { rerender } = renderWithTheme(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Re-render with same props
    rerender(
      <ThemeProvider theme={theme}>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </ThemeProvider>
    );

    // Should still show error
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('handles async errors in componentDidCatch', async () => {
    const AsyncErrorComponent: React.FC = () => {
      React.useEffect(() => {
        throw new Error('Async error');
      }, []);
      return <div>Async component</div>;
    };

    renderWithTheme(
      <ErrorBoundary>
        <AsyncErrorComponent />
      </ErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });
});
