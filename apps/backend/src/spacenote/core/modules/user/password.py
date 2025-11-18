import bcrypt


def hash_password(password: str) -> str:
    """Hash password using bcrypt.

    Args:
        password: Plain text password

    Returns:
        Bcrypt hash as UTF-8 string
    """
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password_hash(password: str, password_hash: str) -> bool:
    """Verify password against bcrypt hash.

    Args:
        password: Plain text password to verify
        password_hash: Bcrypt hash to check against

    Returns:
        True if password matches hash, False otherwise
    """
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
