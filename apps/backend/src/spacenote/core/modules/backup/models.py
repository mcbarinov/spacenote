import re
from datetime import UTC, datetime
from pathlib import Path

from pydantic import Field

from spacenote.core.schema import OpenAPIModel

BACKUP_FILENAME_PATTERN = re.compile(r"^spacenote-backup-(\d{8}-\d{6})\.archive\.gz$")


class BackupInfo(OpenAPIModel):
    """Metadata for a database backup file."""

    filename: str = Field(description="Backup filename")
    size: int = Field(description="File size in bytes")
    created_at: datetime = Field(description="Backup creation timestamp (UTC)")

    @classmethod
    def from_path(cls, path: Path) -> BackupInfo:
        """Create BackupInfo from a backup file path, parsing timestamp from filename."""
        match = BACKUP_FILENAME_PATTERN.match(path.name)
        if not match:
            raise ValueError(f"Invalid backup filename: {path.name}")
        created_at = datetime.strptime(match.group(1), "%Y%m%d-%H%M%S").replace(tzinfo=UTC)
        return cls(filename=path.name, size=path.stat().st_size, created_at=created_at)
