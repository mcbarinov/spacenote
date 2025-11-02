from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Config(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="SPACENOTE_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = Field(description="MongoDB connection string")
    host: str = Field(default="0.0.0.0", description="Server host")  # noqa: S104
    port: int = Field(default=3100, description="Server port")
    debug: bool = Field(default=False, description="Debug mode")
