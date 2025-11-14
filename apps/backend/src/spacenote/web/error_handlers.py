from typing import cast

import structlog
from fastapi import Request, status
from fastapi.responses import JSONResponse

from spacenote.errors import (
    AccessDeniedError,
    AuthenticationError,
    NotFoundError,
    UserError,
    ValidationError,
)

logger = structlog.get_logger()


def create_json_error_response(message: str, error_type: str, status_code: int) -> JSONResponse:
    """Create a standardized JSON error response."""
    return JSONResponse(
        status_code=status_code,
        content={"message": message, "type": error_type},
    )


async def user_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle all UserError subclasses and map them to appropriate HTTP status codes."""
    # This handler is registered specifically for UserError, so we can safely cast
    exc = cast(UserError, exc)

    # Map error types to HTTP status codes
    status_code_map = {
        AuthenticationError: status.HTTP_401_UNAUTHORIZED,
        AccessDeniedError: status.HTTP_403_FORBIDDEN,
        NotFoundError: status.HTTP_404_NOT_FOUND,
        ValidationError: status.HTTP_400_BAD_REQUEST,
    }

    status_code = status_code_map.get(type(exc), status.HTTP_400_BAD_REQUEST)
    error_type = type(exc).__name__.replace("Error", "").lower()

    logger.info(
        "user_error",
        error_type=error_type,
        message=str(exc),
        status_code=status_code,
        path=request.url.path,
    )

    return create_json_error_response(
        message=str(exc),
        error_type=error_type,
        status_code=status_code,
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions."""
    logger.error(
        "unexpected_error",
        error=str(exc),
        error_type=type(exc).__name__,
        path=request.url.path,
        exc_info=exc,
    )

    return create_json_error_response(
        message="An unexpected error occurred",
        error_type="internal_error",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
