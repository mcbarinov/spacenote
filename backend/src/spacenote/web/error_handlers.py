import logging

from fastapi import Request
from fastapi.responses import JSONResponse, Response

from spacenote.core.errors import AccessDeniedError, AuthenticationError, NotFoundError, ValidationError

logger = logging.getLogger(__name__)


def create_json_error_response(status_code: int, title: str, message: str) -> JSONResponse:
    """Create JSON error response."""
    return JSONResponse(status_code=status_code, content={"error": title, "detail": message, "status_code": status_code})


async def user_error_handler(_: Request, exc: Exception) -> Response:
    """Handle all UserError subclasses with appropriate status codes."""
    # Determine the appropriate status code based on error type
    if isinstance(exc, AuthenticationError):
        status_code = 401
        title = "Authentication Required"
    elif isinstance(exc, AccessDeniedError):
        status_code = 403
        title = "Access Denied"
    elif isinstance(exc, NotFoundError):
        status_code = 404
        title = "Not Found"
    elif isinstance(exc, ValidationError):
        status_code = 400
        title = "Invalid Request"
    else:
        # Default for any other UserError subclass
        status_code = 400
        title = "User Error"

    return create_json_error_response(status_code=status_code, title=title, message=str(exc))


async def general_exception_handler(_: Request, exc: Exception) -> Response:
    """Handle unexpected errors (500)."""
    logger.exception("Unexpected error: %s", exc)
    return create_json_error_response(status_code=500, title="Internal Server Error", message="An unexpected error occurred.")
