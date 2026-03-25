"""
Logging Configuration for FastAPI Application
Sets up structured logging with file and console handlers.
"""

import logging
import sys
from logging.handlers import RotatingFileHandler
from datetime import datetime
import os

# Log directory
LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)

# Log format
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

# Console handler format (more concise)
CONSOLE_FORMAT = "%(levelname)-8s | %(asctime)s | %(name)s | %(message)s"


def setup_logging(level: str = "INFO") -> None:
    """
    Configure application-wide logging.
    
    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    """
    
    # Create root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level.upper(), logging.INFO))
    
    # Clear existing handlers
    root_logger.handlers.clear()
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG)
    console_formatter = logging.Formatter(CONSOLE_FORMAT, datefmt=DATE_FORMAT)
    console_handler.setFormatter(console_formatter)
    root_logger.addHandler(console_handler)
    
    # File handler - General log
    general_log = os.path.join(LOG_DIR, "app.log")
    file_handler = RotatingFileHandler(
        general_log,
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    file_handler.setLevel(logging.DEBUG)
    file_formatter = logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT)
    file_handler.setFormatter(file_formatter)
    root_logger.addHandler(file_handler)
    
    # File handler - Errors only
    error_log = os.path.join(LOG_DIR, "error.log")
    error_handler = RotatingFileHandler(
        error_log,
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(file_formatter)
    root_logger.addHandler(error_handler)
    
    # File handler - API access log
    access_log = os.path.join(LOG_DIR, "access.log")
    access_handler = RotatingFileHandler(
        access_log,
        maxBytes=50*1024*1024,  # 50MB
        backupCount=10,
        encoding='utf-8'
    )
    access_handler.setLevel(logging.INFO)
    access_formatter = logging.Formatter(
        "%(asctime)s | %(message)s",
        datefmt=DATE_FORMAT
    )
    access_handler.setFormatter(access_formatter)
    
    # Create access logger
    access_logger = logging.getLogger("uvicorn.access")
    access_logger.addHandler(access_handler)
    access_logger.setLevel(logging.INFO)
    
    # Log startup info
    logger = logging.getLogger(__name__)
    logger.info("=" * 60)
    logger.info(f"Logging initialized at {datetime.now().isoformat()}")
    logger.info(f"Log level: {level}")
    logger.info(f"Log directory: {os.path.abspath(LOG_DIR)}")
    logger.info("=" * 60)


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance with the given name.
    
    Args:
        name: Logger name (usually __name__)
        
    Returns:
        Configured logger instance
    """
    return logging.getLogger(name)


# Custom logging adapter for request tracing
class RequestLoggerAdapter(logging.LoggerAdapter):
    """Logger adapter that includes request ID in log messages."""
    
    def process(self, msg, kwargs):
        return f"[{self.extra.get('request_id', 'N/A')}] {msg}", kwargs


def get_request_logger(request_id: str, name: str = __name__) -> RequestLoggerAdapter:
    """
    Get a logger adapter that includes request ID.
    
    Args:
        request_id: Unique request identifier
        name: Logger name
        
    Returns:
        Logger adapter with request ID
    """
    logger = logging.getLogger(name)
    return RequestLoggerAdapter(logger, {"request_id": request_id})
