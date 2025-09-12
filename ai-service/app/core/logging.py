"""
Logging configuration for AI/ML Service
"""

import logging
import sys
from typing import Any, Dict
import structlog
from structlog.stdlib import LoggerFactory

def setup_logging():
    """Setup structured logging"""
    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.INFO,
    )
    
    # Set log levels for specific modules
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("fastapi").setLevel(logging.INFO)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("openai").setLevel(logging.WARNING)
    logging.getLogger("anthropic").setLevel(logging.WARNING)
    logging.getLogger("chromadb").setLevel(logging.WARNING)
    logging.getLogger("sentence_transformers").setLevel(logging.WARNING)

def get_logger(name: str = None) -> structlog.BoundLogger:
    """Get a structured logger instance"""
    return structlog.get_logger(name)

def log_request(request_data: Dict[str, Any], logger: structlog.BoundLogger = None):
    """Log request data"""
    if logger is None:
        logger = get_logger()
    
    logger.info(
        "AI request received",
        request_type=request_data.get("type"),
        user_role=request_data.get("role"),
        insight_type=request_data.get("insight_type"),
        data_size=len(str(request_data))
    )

def log_response(response_data: Dict[str, Any], logger: structlog.BoundLogger = None):
    """Log response data"""
    if logger is None:
        logger = get_logger()
    
    logger.info(
        "AI response generated",
        response_type=response_data.get("type"),
        model_used=response_data.get("model_used"),
        processing_time=response_data.get("processing_time"),
        success=response_data.get("success", False)
    )

def log_error(error: Exception, context: Dict[str, Any] = None, logger: structlog.BoundLogger = None):
    """Log error with context"""
    if logger is None:
        logger = get_logger()
    
    error_data = {
        "error_type": type(error).__name__,
        "error_message": str(error),
        "context": context or {}
    }
    
    logger.error("AI service error", **error_data)
