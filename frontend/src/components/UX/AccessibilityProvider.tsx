import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, CssBaseline } from '@mui/material';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardOnly: boolean;
  focusVisible: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  isHighContrast: boolean;
  isLargeText: boolean;
  isReducedMotion: boolean;
  isScreenReader: boolean;
  isKeyboardOnly: boolean;
  isFocusVisible: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReader: false,
    keyboardOnly: false,
    focusVisible: false,
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.warn('Failed to parse accessibility settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
  }, [settings]);

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Large text
    if (settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Screen reader
    if (settings.screenReader) {
      root.classList.add('screen-reader');
    } else {
      root.classList.remove('screen-reader');
    }

    // Keyboard only
    if (settings.keyboardOnly) {
      root.classList.add('keyboard-only');
    } else {
      root.classList.remove('keyboard-only');
    }

    // Focus visible
    if (settings.focusVisible) {
      root.classList.add('focus-visible');
    } else {
      root.classList.remove('focus-visible');
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Create theme with accessibility considerations
  const theme = createTheme({
    palette: {
      mode: settings.highContrast ? 'dark' : 'light',
      primary: {
        main: settings.highContrast ? '#FFFFFF' : '#9B7DCF',
        contrastText: settings.highContrast ? '#000000' : '#FFFFFF',
      },
      background: {
        default: settings.highContrast ? '#000000' : '#F8EBF8',
        paper: settings.highContrast ? '#FFFFFF' : '#FFFFFF',
      },
      text: {
        primary: settings.highContrast ? '#FFFFFF' : '#374151',
        secondary: settings.highContrast ? '#CCCCCC' : '#6B7280',
      },
    },
    typography: {
      fontSize: settings.largeText ? 18 : 14,
      h1: {
        fontSize: settings.largeText ? '3rem' : '2.5rem',
      },
      h2: {
        fontSize: settings.largeText ? '2.5rem' : '2rem',
      },
      h3: {
        fontSize: settings.largeText ? '2rem' : '1.75rem',
      },
      h4: {
        fontSize: settings.largeText ? '1.75rem' : '1.5rem',
      },
      h5: {
        fontSize: settings.largeText ? '1.5rem' : '1.25rem',
      },
      h6: {
        fontSize: settings.largeText ? '1.25rem' : '1rem',
      },
      body1: {
        fontSize: settings.largeText ? '1.125rem' : '1rem',
      },
      body2: {
        fontSize: settings.largeText ? '1rem' : '0.875rem',
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            minHeight: settings.largeText ? '48px' : '36px',
            padding: settings.largeText ? '12px 24px' : '8px 16px',
            fontSize: settings.largeText ? '1.125rem' : '1rem',
            '&:focus-visible': {
              outline: settings.focusVisible ? '3px solid #9B7DCF' : 'none',
              outlineOffset: '2px',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiInputBase-root': {
              minHeight: settings.largeText ? '48px' : '40px',
              fontSize: settings.largeText ? '1.125rem' : '1rem',
            },
            '& .MuiInputLabel-root': {
              fontSize: settings.largeText ? '1.125rem' : '1rem',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            '&:focus-visible': {
              outline: settings.focusVisible ? '3px solid #9B7DCF' : 'none',
              outlineOffset: '2px',
            },
          },
        },
      },
    },
  });

  const value: AccessibilityContextType = {
    settings,
    updateSettings,
    isHighContrast: settings.highContrast,
    isLargeText: settings.largeText,
    isReducedMotion: settings.reducedMotion,
    isScreenReader: settings.screenReader,
    isKeyboardOnly: settings.keyboardOnly,
    isFocusVisible: settings.focusVisible,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            // Global accessibility styles
            '& .high-contrast': {
              filter: 'contrast(150%)',
            },
            '& .large-text': {
              fontSize: '1.2em',
            },
            '& .reduced-motion': {
              '& *': {
                animationDuration: '0.01ms !important',
                animationDelay: '0.01ms !important',
                transitionDuration: '0.01ms !important',
                transitionDelay: '0.01ms !important',
              },
            },
            '& .screen-reader': {
              '& .sr-only': {
                position: 'static',
                width: 'auto',
                height: 'auto',
                padding: '0',
                margin: '0',
                overflow: 'visible',
                clip: 'auto',
                whiteSpace: 'normal',
              },
            },
            '& .keyboard-only': {
              '& *:focus': {
                outline: '3px solid #9B7DCF !important',
                outlineOffset: '2px !important',
              },
            },
            '& .focus-visible': {
              '& *:focus-visible': {
                outline: '3px solid #9B7DCF !important',
                outlineOffset: '2px !important',
              },
            },
            // High contrast focus indicators
            '& .high-contrast *:focus': {
              outline: '3px solid #FFFFFF !important',
              outlineOffset: '2px !important',
            },
            // Large touch targets for mobile
            '& .large-text button, & .large-text [role="button"]': {
              minHeight: '48px',
              minWidth: '48px',
            },
            // Screen reader only content
            '& .sr-only': {
              position: 'absolute',
              width: '1px',
              height: '1px',
              padding: '0',
              margin: '-1px',
              overflow: 'hidden',
              clip: 'rect(0, 0, 0, 0)',
              whiteSpace: 'nowrap',
              border: '0',
            },
            // Skip links
            '& .skip-link': {
              position: 'absolute',
              top: '-40px',
              left: '6px',
              background: '#9B7DCF',
              color: 'white',
              padding: '8px',
              textDecoration: 'none',
              borderRadius: '4px',
              zIndex: 1000,
              '&:focus': {
                top: '6px',
              },
            },
          }}
        >
          {children}
        </Box>
      </ThemeProvider>
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

export default AccessibilityProvider;

