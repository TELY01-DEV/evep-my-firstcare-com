import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Alert, AlertTitle } from '@mui/material';
import { Refresh, BugReport } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Global Error Boundary to catch React errors including error #31
 * Specifically handles object rendering errors
 */
class ReactErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console for debugging
    console.error('React Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Check if this is React error #31 (object rendering error)
    if (error.message.includes('Minified React error #31') || 
        error.message.includes('object with keys')) {
      console.error('React Error #31 detected - Object rendering error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            p: 3,
            textAlign: 'center'
          }}
        >
          <Alert severity="error" sx={{ mb: 3, maxWidth: 600 }}>
            <AlertTitle>
              <Box display="flex" alignItems="center" gap={1}>
                <BugReport />
                Application Error
              </Box>
            </AlertTitle>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Something went wrong while rendering this component.
            </Typography>
            
            {this.state.error?.message.includes('Minified React error #31') && (
              <Typography variant="body2" color="warning.main" sx={{ mb: 2 }}>
                <strong>React Error #31:</strong> An object was rendered directly in JSX. 
                This usually happens when address or other objects are displayed without proper formatting.
              </Typography>
            )}
            
            <Typography variant="body2" sx={{ mb: 2 }}>
              Error: {this.state.error?.message || 'Unknown error'}
            </Typography>
            
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={this.handleRetry}
              sx={{ mt: 1 }}
            >
              Try Again
            </Button>
          </Alert>
          
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <Box sx={{ mt: 2, maxWidth: 800 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Development Error Details:
              </Typography>
              <Box
                component="pre"
                sx={{
                  backgroundColor: 'grey.100',
                  p: 2,
                  borderRadius: 1,
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  maxHeight: 300
                }}
              >
                {this.state.error?.stack}
                {this.state.errorInfo.componentStack}
              </Box>
            </Box>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ReactErrorBoundary;
