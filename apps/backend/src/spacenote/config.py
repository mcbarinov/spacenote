from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_MAX_UPLOAD_SIZE = 500 * 1024 * 1024


class Config(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="SPACENOTE_", env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = Field(description="MongoDB connection string")
    host: str = Field(default="0.0.0.0", description="Server host")  # noqa: S104
    port: int = Field(default=3100, description="Server port")
    debug: bool = Field(default=False, description="Debug mode")
    cors_origins: list[str] = Field(default=["http://localhost:3000"], description="CORS allowed origins")
    attachments_path: str = Field(default="./data/attachments", description="Attachment storage path")
    images_path: str = Field(default="./data/images", description="Image storage path")
    telegram_bot_token: str | None = Field(default=None, description="Telegram bot token")
    max_upload_size: int = Field(default=DEFAULT_MAX_UPLOAD_SIZE, description="Max file upload size in bytes")

    @field_validator("max_upload_size", mode="before")
    @classmethod
    def parse_max_upload_size(cls, v: object) -> object:
        if v == "":
            return DEFAULT_MAX_UPLOAD_SIZE
        return v
