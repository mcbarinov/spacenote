"""
Core configuration for SpaceNote.

Configuration specific to the core business logic layer.
Web-specific configuration is handled separately in web/config.py
"""

from pydantic_settings import BaseSettings


class CoreConfig(BaseSettings):
    """Configuration for core SpaceNote functionality."""

    # Database
    database_url: str

    # Logging
    debug: bool

    model_config = {
        "env_file": [".env", "../.env"],
        "env_prefix": "SPACENOTE_",
        "extra": "ignore",
    }
