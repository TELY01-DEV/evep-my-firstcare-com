interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  url?: string;
  userAgent?: string;
}

class EVEPLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private sessionId: string;
  private userId?: string;
  private isDevelopment = process.env.NODE_ENV === 'development';

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandling();
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private setupGlobalErrorHandling(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', {
        reason: event.reason,
        stack: event.reason?.stack,
        type: 'unhandledrejection'
      });
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      this.error('Global Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack,
        type: 'global_error'
      });
    });

    // Handle console errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.error('Console Error', { args: args.map(arg => String(arg)) });
      originalConsoleError.apply(console, args);
    };
  }

  private addLog(level: string, message: string, context?: Record<string, any>): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      userId: this.userId,
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.logs.push(logEntry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output in development
    if (this.isDevelopment) {
      const consoleMethod = level === 'error' ? 'error' : 
                           level === 'warn' ? 'warn' : 
                           level === 'info' ? 'info' : 'log';
      
      console[consoleMethod](
        `[${level.toUpperCase()}] ${message}`,
        context ? context : ''
      );
    }

    // Send to remote logging service in production
    if (!this.isDevelopment && level === 'error') {
      this.sendToRemoteLogging(logEntry);
    }
  }

  private async sendToRemoteLogging(logEntry: LogEntry): Promise<void> {
    try {
      await fetch('http://localhost:8013/api/v1/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry),
      });
    } catch (error) {
      // Fallback to console if remote logging fails
      console.error('Failed to send log to remote service:', error);
    }
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  debug(message: string, context?: Record<string, any>): void {
    this.addLog('debug', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.addLog('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.addLog('warn', message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    this.addLog('error', message, context);
  }

  logNavigation(from: string, to: string): void {
    this.info('Navigation', { from, to });
  }

  logApiCall(method: string, url: string, status: number, duration: number, context?: Record<string, any>): void {
    this.info('API Call', {
      method,
      url,
      status,
      duration,
      ...context
    });
  }

  logAuthEvent(event: string, context?: Record<string, any>): void {
    this.info('Auth Event', { event, ...context });
  }

  logUserAction(action: string, context?: Record<string, any>): void {
    this.info('User Action', { action, ...context });
  }

  logPerformance(metric: string, value: number, context?: Record<string, any>): void {
    this.info('Performance', { metric, value, ...context });
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getLogsByLevel(level: string): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  downloadLogs(): void {
    const data = this.exportLogs();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evep-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Create singleton instance
export const logger = new EVEPLogger();

// Export for use in components
export default logger;
