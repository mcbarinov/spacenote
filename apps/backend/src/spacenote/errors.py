from abc import ABC


class UserError(ABC, Exception):
    """Base class for user-related errors.

    All errors that inherit from UserError will have their messages
    displayed to the user. These errors should not contain any
    sensitive information.
    """


class NotFoundError(UserError):
    """Raised when a requested resource is not found."""

    def __init__(self, message: str = "Document not found") -> None:
        super().__init__(message)


class AuthenticationError(UserError):
    """Raised when authentication fails."""

    def __init__(self, message: str = "Authentication failed") -> None:
        super().__init__(message)


class AccessDeniedError(UserError):
    """Raised when a user tries to access a resource they do not have permission for."""

    def __init__(self, message: str = "Access denied") -> None:
        super().__init__(message)


class ValidationError(UserError):
    """Raised when user input fails validation."""


class ImageProcessingError(UserError):
    """Raised when image is still being processed."""

    def __init__(self, message: str = "Image is still processing") -> None:
        super().__init__(message)
