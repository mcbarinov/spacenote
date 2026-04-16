import asyncio
import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path

import structlog


class _ShutdownNoiseFilter(logging.Filter):
    """Suppress expected CancelledError/KeyboardInterrupt tracebacks on Ctrl+C shutdown."""

    def filter(self, record: logging.LogRecord) -> bool:
        if record.levelno >= logging.ERROR and record.exc_info:
            exc_type = record.exc_info[0]
            if exc_type is not None and issubclass(exc_type, (KeyboardInterrupt, asyncio.CancelledError)):
                return False
        if record.levelno >= logging.ERROR:
            msg = record.getMessage()
            if "CancelledError" in msg or "KeyboardInterrupt" in msg:
                return False
        return True


class _AsgiExceptionFilter(logging.Filter):
    """Suppress uvicorn's duplicate 'Exception in ASGI application' tracebacks.

    These are already logged with full context by our general_exception_handler via structlog.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        if record.exc_info and record.levelno >= logging.ERROR:
            msg = record.getMessage()
            if "Exception in ASGI application" in msg:
                return False
        return True


def setup_logging(debug: bool, logs_path: Path | None = None) -> None:
    log_level = logging.DEBUG if debug else logging.INFO

    # Shared pre-chain for processing foreign (non-structlog) log records
    foreign_pre_chain: list[structlog.types.Processor] = [
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
    ]

    # Structlog processors — end with wrap_for_formatter so each handler renders independently
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
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Console handler for stdout
    console_renderer = structlog.dev.ConsoleRenderer() if debug else structlog.processors.JSONRenderer()
    console_formatter = structlog.stdlib.ProcessorFormatter(
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            console_renderer,
        ],
        foreign_pre_chain=foreign_pre_chain,
    )
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(console_formatter)

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.handlers = [console_handler]

    # Suppress noisy loggers
    uvicorn_error = logging.getLogger("uvicorn.error")
    uvicorn_error.addFilter(_ShutdownNoiseFilter())
    uvicorn_error.addFilter(_AsgiExceptionFilter())

    logging.getLogger("pymongo").setLevel(logging.WARNING)
    logging.getLogger("multipart").setLevel(logging.WARNING)
    logging.getLogger("python_multipart").setLevel(logging.WARNING)
    logging.getLogger("telegram").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("PIL").setLevel(logging.WARNING)

    # Route uvicorn logs through structlog so they match the app format
    for logger_name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        uv_logger = logging.getLogger(logger_name)
        uv_logger.handlers = [console_handler]
        uv_logger.propagate = False

    # File handler for WARNING/ERROR logs (no ANSI, always JSON)
    if logs_path is not None:
        logs_path.mkdir(parents=True, exist_ok=True)
        file_handler = RotatingFileHandler(
            logs_path / "error.log",
            maxBytes=3 * 1024 * 1024,
            backupCount=5,
        )
        file_handler.setLevel(logging.WARNING)
        file_formatter = structlog.stdlib.ProcessorFormatter(
            processors=[
                structlog.stdlib.ProcessorFormatter.remove_processors_meta,
                structlog.processors.JSONRenderer(),
            ],
            foreign_pre_chain=foreign_pre_chain,
        )
        file_handler.setFormatter(file_formatter)
        root_logger.addHandler(file_handler)
