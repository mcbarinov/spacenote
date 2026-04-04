import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Load .env: from explicit path if set, otherwise from current directory
load_dotenv(os.environ.get("SPACENOTE_DOTENV_PATH", ".env"))

DEFAULT_MAX_UPLOAD_SIZE = 500 * 1024 * 1024


class Config(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="SPACENOTE_", extra="ignore")

    database_url: str = Field(description="MongoDB connection string")
    site_url: str = Field(description="Site URL for links in notifications")
    host: str = Field(description="Server host")
    port: int = Field(description="Server port")
    debug: bool = Field(default=False, description="Debug mode")
    cors_origins: list[str] = Field(description="CORS allowed origins")
    data_dir: Path = Field(description="Root data directory for all app storage")
    telegram_bot_token: str | None = Field(default=None, description="Telegram bot token")
    max_upload_size: int = Field(default=DEFAULT_MAX_UPLOAD_SIZE, description="Max file upload size in bytes")

    @property
    def attachments_path(self) -> Path:
        """Uploaded note/space attachment files: {data_dir}/attachments/{space}/{note}/{number}"""
        return self.data_dir / "attachments"

    @property
    def images_path(self) -> Path:
        """Generated WebP previews of image attachments: {data_dir}/images/{space}/{note}/{number}"""
        return self.data_dir / "images"

    @property
    def backups_path(self) -> Path:
        """mongodump archives: {data_dir}/backups/spacenote-backup-{timestamp}.archive.gz"""
        return self.data_dir / "backups"

    @field_validator("max_upload_size", mode="before")
    @classmethod
    def parse_max_upload_size(cls, v: object) -> object:
        if v == "":
            return DEFAULT_MAX_UPLOAD_SIZE
        return v
