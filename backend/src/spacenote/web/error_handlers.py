import logging

from fastapi import Request
from fastapi.responses import JSONResponse, Response

from spacenote.core.errors import AccessDeniedError, AuthenticationError, NotFoundError, ValidationError

logger = logging.getLogger(__name__)


def create_json_error_response(status_code: int, message: str) -> JSONResponse:
    """Create JSON error response."""
    return JSONResponse(status_code=status_code, content={"message": message})


async def user_error_handler(_: Request, exc: Exception) -> Response:
    """Handle all UserError subclasses with appropriate status codes."""
    # Determine the appropriate status code based on error type
    if isinstance(exc, AuthenticationError):
        status_code = 401
    elif isinstance(exc, AccessDeniedError):
        status_code = 403
    elif isinstance(exc, NotFoundError):
        status_code = 404
    elif isinstance(exc, ValidationError):
        status_code = 400
    else:
        # Default for any other UserError subclass
        status_code = 400

    return create_json_error_response(status_code=status_code, message=str(exc))


async def general_exception_handler(_: Request, exc: Exception) -> Response:
    """Handle unexpected errors (500)."""
    logger.exception("Unexpected error: %s", exc)
    return create_json_error_response(status_code=500, message="An unexpected error occurred.")
