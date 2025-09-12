import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccessibilityProvider, useAccessibility } from '../AccessibilityProvider';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test component to access context
const TestComponent: React.FC = () => {
  const {
    settings,
    updateSettings,
    isHighContrast,
    isLargeText,
    isReducedMotion,
    isScreenReader,
    isKeyboardOnly,
    isFocusVisible,
  } = useAccessibility();

  return (
    <div>
      <div data-testid="high-contrast">{isHighContrast.toString()}</div>
      <div data-testid="large-text">{isLargeText.toString()}</div>
      <div data-testid="reduced-motion">{isReducedMotion.toString()}</div>
      <div data-testid="screen-reader">{isScreenReader.toString()}</div>
      <div data-testid="keyboard-only">{isKeyboardOnly.toString()}</div>
      <div data-testid="focus-visible">{isFocusVisible.toString()}</div>
      <button
        data-testid="toggle-high-contrast"
        onClick={() => updateSettings({ highContrast: !isHighContrast })}
      >
        Toggle High Contrast
      </button>
      <button
        data-testid="toggle-large-text"
        onClick={() => updateSettings({ largeText: !isLargeText })}
      >
        Toggle Large Text
      </button>
      <button
        data-testid="toggle-reduced-motion"
        onClick={() => updateSettings({ reducedMotion: !isReducedMotion })}
      >
        Toggle Reduced Motion
      </button>
      <button
        data-testid="toggle-screen-reader"
        onClick={() => updateSettings({ screenReader: !isScreenReader })}
      >
        Toggle Screen Reader
      </button>
      <button
        data-testid="toggle-keyboard-only"
        onClick={() => updateSettings({ keyboardOnly: !isKeyboardOnly })}
      >
        Toggle Keyboard Only
      </button>
      <button
        data-testid="toggle-focus-visible"
        onClick={() => updateSettings({ focusVisible: !isFocusVisible })}
      >
        Toggle Focus Visible
      </button>
      <div data-testid="settings">{JSON.stringify(settings)}</div>
    </div>
  );
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <AccessibilityProvider>
      {component}
    </AccessibilityProvider>
  );
};

describe('AccessibilityProvider', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    localStorageMock.getItem.mockClear();
  });

  it('renders children without crashing', () => {
    renderWithProvider(<div data-testid="test-child">Test Child</div>);
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('provides default accessibility settings', () => {
    renderWithProvider(<TestComponent />);
    
    expect(screen.getByTestId('high-contrast')).toHaveTextContent('false');
    expect(screen.getByTestId('large-text')).toHaveTextContent('false');
    expect(screen.getByTestId('reduced-motion')).toHaveTextContent('false');
    expect(screen.getByTestId('screen-reader')).toHaveTextContent('false');
    expect(screen.getByTestId('keyboard-only')).toHaveTextContent('false');
    expect(screen.getByTestId('focus-visible')).toHaveTextContent('false');
  });

  it('loads settings from localStorage on mount', () => {
    const savedSettings = {
      highContrast: true,
      largeText: false,
      reducedMotion: true,
      screenReader: false,
      keyboardOnly: false,
      focusVisible: true,
    };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedSettings));

    renderWithProvider(<TestComponent />);
    
    expect(screen.getByTestId('high-contrast')).toHaveTextContent('true');
    expect(screen.getByTestId('large-text')).toHaveTextContent('false');
    expect(screen.getByTestId('reduced-motion')).toHaveTextContent('true');
    expect(screen.getByTestId('screen-reader')).toHaveTextContent('false');
    expect(screen.getByTestId('keyboard-only')).toHaveTextContent('false');
    expect(screen.getByTestId('focus-visible')).toHaveTextContent('true');
  });

  it('handles invalid localStorage data gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid-json');

    renderWithProvider(<TestComponent />);
    
    // Should still render with default settings
    expect(screen.getByTestId('high-contrast')).toHaveTextContent('false');
    expect(screen.getByTestId('large-text')).toHaveTextContent('false');
  });

  it('updates settings when updateSettings is called', () => {
    renderWithProvider(<TestComponent />);
    
    // Initially false
    expect(screen.getByTestId('high-contrast')).toHaveTextContent('false');
    
    // Toggle high contrast
    fireEvent.click(screen.getByTestId('toggle-high-contrast'));
    
    // Should now be true
    expect(screen.getByTestId('high-contrast')).toHaveTextContent('true');
  });

  it('saves settings to localStorage when they change', () => {
    renderWithProvider(<TestComponent />);
    
    fireEvent.click(screen.getByTestId('toggle-high-contrast'));
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'accessibility-settings',
      expect.stringContaining('"highContrast":true')
    );
  });

  it('updates multiple settings at once', () => {
    renderWithProvider(<TestComponent />);
    
    // Update multiple settings
    const testComponent = screen.getByTestId('settings');
    const initialSettings = JSON.parse(testComponent.textContent || '{}');
    
    fireEvent.click(screen.getByTestId('toggle-high-contrast'));
    fireEvent.click(screen.getByTestId('toggle-large-text'));
    
    const updatedSettings = JSON.parse(testComponent.textContent || '{}');
    expect(updatedSettings.highContrast).toBe(true);
    expect(updatedSettings.largeText).toBe(true);
  });

  it('applies high contrast class to document when enabled', () => {
    renderWithProvider(<TestComponent />);
    
    fireEvent.click(screen.getByTestId('toggle-high-contrast'));
    
    expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
  });

  it('applies large text class to document when enabled', () => {
    renderWithProvider(<TestComponent />);
    
    fireEvent.click(screen.getByTestId('toggle-large-text'));
    
    expect(document.documentElement.classList.contains('large-text')).toBe(true);
  });

  it('applies reduced motion class to document when enabled', () => {
    renderWithProvider(<TestComponent />);
    
    fireEvent.click(screen.getByTestId('toggle-reduced-motion'));
    
    expect(document.documentElement.classList.contains('reduced-motion')).toBe(true);
  });

  it('applies screen reader class to document when enabled', () => {
    renderWithProvider(<TestComponent />);
    
    fireEvent.click(screen.getByTestId('toggle-screen-reader'));
    
    expect(document.documentElement.classList.contains('screen-reader')).toBe(true);
  });

  it('applies keyboard only class to document when enabled', () => {
    renderWithProvider(<TestComponent />);
    
    fireEvent.click(screen.getByTestId('toggle-keyboard-only'));
    
    expect(document.documentElement.classList.contains('keyboard-only')).toBe(true);
  });

  it('applies focus visible class to document when enabled', () => {
    renderWithProvider(<TestComponent />);
    
    fireEvent.click(screen.getByTestId('toggle-focus-visible'));
    
    expect(document.documentElement.classList.contains('focus-visible')).toBe(true);
  });

  it('removes classes when settings are disabled', () => {
    renderWithProvider(<TestComponent />);
    
    // Enable high contrast
    fireEvent.click(screen.getByTestId('toggle-high-contrast'));
    expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
    
    // Disable high contrast
    fireEvent.click(screen.getByTestId('toggle-high-contrast'));
    expect(document.documentElement.classList.contains('high-contrast')).toBe(false);
  });

  it('creates theme with accessibility considerations', () => {
    renderWithProvider(<TestComponent />);
    
    // Enable high contrast
    fireEvent.click(screen.getByTestId('toggle-high-contrast'));
    
    // The theme should be applied through ThemeProvider
    // Check that the high contrast class is applied to document
    expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
    
    // Check that the theme is properly configured by verifying the setting is updated
    expect(screen.getByTestId('high-contrast')).toHaveTextContent('true');
  });

  it('throws error when useAccessibility is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Create a component that uses useAccessibility without provider
    const TestComponentWithoutProvider: React.FC = () => {
      const { useAccessibility } = require('../AccessibilityProvider');
      useAccessibility();
      return <div>Test</div>;
    };
    
    expect(() => {
      render(<TestComponentWithoutProvider />);
    }).toThrow('useAccessibility must be used within an AccessibilityProvider');
    
    consoleSpy.mockRestore();
  });

  it('handles partial settings updates correctly', () => {
    renderWithProvider(<TestComponent />);
    
    // Update only one setting
    fireEvent.click(screen.getByTestId('toggle-large-text'));
    
    const testComponent = screen.getByTestId('settings');
    const settings = JSON.parse(testComponent.textContent || '{}');
    
    expect(settings.largeText).toBe(true);
    expect(settings.highContrast).toBe(false); // Should remain unchanged
  });

  it('persists settings across component re-renders', () => {
    const { rerender } = renderWithProvider(<TestComponent />);
    
    // Enable high contrast
    fireEvent.click(screen.getByTestId('toggle-high-contrast'));
    expect(screen.getByTestId('high-contrast')).toHaveTextContent('true');
    
    // Re-render component
    rerender(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );
    
    // Setting should still be enabled
    expect(screen.getByTestId('high-contrast')).toHaveTextContent('true');
  });

  it('applies accessibility styles to the document', () => {
    renderWithProvider(<TestComponent />);
    
    // Enable focus visible
    fireEvent.click(screen.getByTestId('toggle-focus-visible'));
    
    // Check that accessibility styles are applied
    const styleElement = document.querySelector('style');
    expect(styleElement).toBeInTheDocument();
  });

  it('handles rapid setting changes correctly', () => {
    renderWithProvider(<TestComponent />);
    
    // Rapidly toggle settings
    fireEvent.click(screen.getByTestId('toggle-high-contrast'));
    fireEvent.click(screen.getByTestId('toggle-large-text'));
    fireEvent.click(screen.getByTestId('toggle-reduced-motion'));
    
    // All should be enabled
    expect(screen.getByTestId('high-contrast')).toHaveTextContent('true');
    expect(screen.getByTestId('large-text')).toHaveTextContent('true');
    expect(screen.getByTestId('reduced-motion')).toHaveTextContent('true');
  });
});
