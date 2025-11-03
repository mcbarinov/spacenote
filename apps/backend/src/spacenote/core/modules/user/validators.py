from spacenote.errors import ValidationError
from spacenote.utils import is_slug


def validate_user_id(user_id: str) -> None:
    """Validate user ID meets requirements.

    Requirements:
    - Must be a valid slug (lowercase alphanumeric with hyphens)

    Raises:
        ValidationError: If user ID doesn't meet requirements
    """
    if not is_slug(user_id):
        raise ValidationError("User ID must be a valid slug (lowercase alphanumeric with hyphens)")


def validate_password(password: str) -> None:
    """Validate password meets requirements.

    Requirements:
    - No whitespace characters
    - Minimum length of 2 characters

    Raises:
        ValidationError: If password doesn't meet requirements
    """
    if len(password) < 2:
        raise ValidationError("Password must be at least 2 characters long")

    if any(char.isspace() for char in password):
        raise ValidationError("Password cannot contain whitespace characters")
