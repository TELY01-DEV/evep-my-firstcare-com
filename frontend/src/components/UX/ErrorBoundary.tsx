import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Stack,
  Divider,
  Chip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  Support as SupportIcon,
  BugReport as BugReportIcon,
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

const ErrorContainer = styled(Card)(({ theme }) => ({
  margin: theme.spacing(3),
  maxWidth: 600,
  marginLeft: 'auto',
  marginRight: 'auto',
  border: `2px solid ${theme.palette.error.main}`,
  borderRadius: theme.spacing(2),
}));

const ErrorHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.error.light + '20',
  borderRadius: theme.spacing(1),
}));

const ErrorDetails = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.grey[50],
  borderRadius: theme.spacing(1),
  fontFamily: 'monospace',
  fontSize: '0.875rem',
  overflow: 'auto',
  maxHeight: 300,
}));

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to external service (if available)
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Example: Send error to logging service
      const errorData = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      // In a real application, you would send this to your error logging service
      console.log('Error logged:', errorData);
      
      // Example: Send to external service
      // fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorData),
      // });
    } catch (loggingError) {
      console.warn('Failed to log error:', loggingError);
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
    
    // Force a re-render of children
    this.forceUpdate();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleContactSupport = () => {
    const errorDetails = this.state.error
      ? `Error: ${this.state.error.message}\nStack: ${this.state.error.stack}`
      : 'Unknown error';
    
    const subject = encodeURIComponent('EVEP Platform Error Report');
    const body = encodeURIComponent(
      `I encountered an error while using the EVEP Platform.\n\nError Details:\n${errorDetails}\n\nError ID: ${this.state.errorId}\n\nPlease help me resolve this issue.`
    );
    
    window.open(`mailto:support@evep.com?subject=${subject}&body=${body}`);
  };

  private handleReportBug = () => {
    const errorDetails = this.state.error
      ? `Error: ${this.state.error.message}\nStack: ${this.state.error.stack}`
      : 'Unknown error';
    
    const bugReport = {
      title: 'Application Error',
      description: `An error occurred in the EVEP Platform.\n\nError Details:\n${errorDetails}`,
      errorId: this.state.errorId,
      severity: 'high',
      steps: '1. User was using the application\n2. Error occurred unexpectedly\n3. Error boundary caught the error',
      expected: 'Application should work without errors',
      actual: 'Application crashed with error',
    };
    
    // In a real application, you would send this to your bug tracking system
    console.log('Bug report:', bugReport);
    
    // Example: Open bug report form
    window.open('/bug-report', '_blank');
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorContainer elevation={3}>
          <CardContent>
            <ErrorHeader>
              <ErrorIcon color="error" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h5" component="h1" color="error">
                  Something went wrong
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  We're sorry, but something unexpected happened.
                </Typography>
              </Box>
            </ErrorHeader>

            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>Error Details</AlertTitle>
              {this.state.error?.message || 'An unknown error occurred'}
            </Alert>

            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  What happened?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  The application encountered an unexpected error. This might be due to:
                </Typography>
                <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      A temporary network issue
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      An unexpected data format
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      A browser compatibility issue
                    </Typography>
                  </li>
                </Box>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom>
                  What can you do?
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={this.handleRetry}
                    size="small"
                  >
                    Try Again
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<HomeIcon />}
                    onClick={this.handleGoHome}
                    size="small"
                  >
                    Go Home
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<SupportIcon />}
                    onClick={this.handleContactSupport}
                    size="small"
                  >
                    Contact Support
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<BugReportIcon />}
                    onClick={this.handleReportBug}
                    size="small"
                  >
                    Report Bug
                  </Button>
                </Stack>
              </Box>

              {this.state.errorId && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Error ID: <Chip label={this.state.errorId} size="small" />
                  </Typography>
                </Box>
              )}

              {this.props.showDetails && this.state.error && (
                <ErrorDetails>
                  <Typography variant="subtitle2" gutterBottom>
                    Technical Details:
                  </Typography>
                  <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                    {this.state.error.stack}
                  </Typography>
                  {this.state.errorInfo && (
                    <>
                      <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                        Component Stack:
                      </Typography>
                      <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                        {this.state.errorInfo.componentStack}
                      </Typography>
                    </>
                  )}
                </ErrorDetails>
              )}
            </Stack>
          </CardContent>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
