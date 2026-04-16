from datetime import datetime

from pydantic import Field

from spacenote.core.schema import OpenAPIModel


class ErrorLog(OpenAPIModel):
    """Error log file content and metadata."""

    content: str = Field(description="Log file text content")
    size: int = Field(description="File size in bytes")
    modified_at: datetime | None = Field(description="Last modification timestamp (UTC)")
