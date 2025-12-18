from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


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
    max_upload_size: int = Field(default=500 * 1024 * 1024, description="Max file upload size in bytes")
