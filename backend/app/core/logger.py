import logging
import logging.handlers
import os
import sys
from datetime import datetime
from pathlib import Path
import json
from typing import Any, Dict, Optional

class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging"""
    
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
            "message": record.getMessage(),
        }
        
        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields if present
        if hasattr(record, 'extra_fields'):
            log_entry.update(record.extra_fields)
        
        return json.dumps(log_entry, ensure_ascii=False)

class EVEPLogger:
    """EVEP Logger configuration"""
    
    def __init__(self, name: str = "evep"):
        self.name = name
        self.logger = logging.getLogger(name)
        self.setup_logger()
    
    def setup_logger(self):
        """Setup logger with handlers and formatters"""
        # Create logs directory if it doesn't exist
        log_dir = Path("logs")
        log_dir.mkdir(exist_ok=True)
        
        # Clear existing handlers
        self.logger.handlers.clear()
        
        # Set log level
        log_level = os.getenv("LOG_LEVEL", "INFO").upper()
        self.logger.setLevel(getattr(logging, log_level))
        
        # Console handler with colored output
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.INFO)
        console_formatter = logging.Formatter(
            '%(asctime)s | %(levelname)-8s | %(name)s | %(module)s:%(lineno)d | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        console_handler.setFormatter(console_formatter)
        
        # File handler for all logs
        file_handler = logging.handlers.RotatingFileHandler(
            log_dir / "evep.log",
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
        file_handler.setLevel(logging.DEBUG)
        file_formatter = JSONFormatter()
        file_handler.setFormatter(file_formatter)
        
        # Error file handler
        error_handler = logging.handlers.RotatingFileHandler(
            log_dir / "evep_errors.log",
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(file_formatter)
        
        # API specific handler
        api_handler = logging.handlers.RotatingFileHandler(
            log_dir / "evep_api.log",
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
        api_handler.setLevel(logging.INFO)
        api_handler.setFormatter(file_formatter)
        
        # Add handlers
        self.logger.addHandler(console_handler)
        self.logger.addHandler(file_handler)
        self.logger.addHandler(error_handler)
        self.logger.addHandler(api_handler)
        
        # Prevent propagation to root logger
        self.logger.propagate = False
    
    def log_with_context(self, level: str, message: str, **kwargs):
        """Log with additional context"""
        extra_fields = {
            "context": kwargs,
            "timestamp": datetime.utcnow().isoformat(),
            "environment": os.getenv("ENVIRONMENT", "development"),
            "service": "evep-backend"
        }
        
        record = logging.LogRecord(
            name=self.name,
            level=getattr(logging, level.upper()),
            pathname="",
            lineno=0,
            msg=message,
            args=(),
            exc_info=None
        )
        record.extra_fields = extra_fields
        self.logger.handle(record)
    
    def debug(self, message: str, **kwargs):
        """Debug level logging"""
        self.log_with_context("DEBUG", message, **kwargs)
    
    def info(self, message: str, **kwargs):
        """Info level logging"""
        self.log_with_context("INFO", message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        """Warning level logging"""
        self.log_with_context("WARNING", message, **kwargs)
    
    def error(self, message: str, **kwargs):
        """Error level logging"""
        self.log_with_context("ERROR", message, **kwargs)
    
    def critical(self, message: str, **kwargs):
        """Critical level logging"""
        self.log_with_context("CRITICAL", message, **kwargs)
    
    def log_request(self, method: str, path: str, status_code: int, duration: float, **kwargs):
        """Log HTTP request details"""
        self.info(
            f"HTTP {method} {path} - {status_code} ({duration:.3f}s)",
            request_method=method,
            request_path=path,
            status_code=status_code,
            duration=duration,
            **kwargs
        )
    
    def log_auth_event(self, event_type: str, user_id: Optional[str] = None, **kwargs):
        """Log authentication events"""
        self.info(
            f"Auth event: {event_type}",
            auth_event=event_type,
            user_id=user_id,
            **kwargs
        )
    
    def log_database_event(self, operation: str, collection: str, **kwargs):
        """Log database operations"""
        self.debug(
            f"Database {operation} on {collection}",
            db_operation=operation,
            db_collection=collection,
            **kwargs
        )

# Create main logger instance
logger = EVEPLogger("evep")

# Create specific loggers
api_logger = EVEPLogger("evep.api")
auth_logger = EVEPLogger("evep.auth")
db_logger = EVEPLogger("evep.database")
socket_logger = EVEPLogger("evep.socket")

def get_logger(name: str) -> EVEPLogger:
    """Get a logger instance by name"""
    return EVEPLogger(name)
