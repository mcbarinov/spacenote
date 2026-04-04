"""Database backup service using mongodump."""

import asyncio
import re
from datetime import UTC, datetime
from pathlib import Path

import structlog

from spacenote.core.modules.backup.models import BACKUP_FILENAME_PATTERN, BackupInfo
from spacenote.core.service import Service
from spacenote.errors import BackupError, NotFoundError, ValidationError

logger = structlog.get_logger(__name__)


class BackupService(Service):
    """Service for creating and managing MongoDB backups via mongodump."""

    async def create_backup(self) -> BackupInfo:
        """Create a database backup using mongodump."""
        backups_dir = self.core.config.backups_path
        backups_dir.mkdir(parents=True, exist_ok=True)

        now = datetime.now(UTC)
        filename = f"spacenote-backup-{now.strftime('%Y%m%d-%H%M%S')}.archive.gz"
        backup_path = backups_dir / filename
        if backup_path.exists():
            raise BackupError("Backup already exists for this second, try again")

        # --uri is fine here: runs inside our Docker container, credentials are already in env/config
        process = await asyncio.create_subprocess_exec(
            "mongodump",
            f"--uri={self.core.config.database_url}",
            f"--archive={backup_path}",
            "--gzip",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr = await process.communicate()

        if process.returncode != 0:
            # Sanitize stderr to avoid leaking connection string with credentials
            error_msg = re.sub(r"mongodb://[^\s]+", "mongodb://***", stderr.decode().strip())
            logger.error("mongodump failed", returncode=process.returncode, stderr=error_msg)
            raise BackupError("Database backup failed, check server logs")

        logger.info("backup created", filename=filename, size=backup_path.stat().st_size)
        return BackupInfo.from_path(backup_path)

    def list_backups(self) -> list[BackupInfo]:
        """List all backup files sorted by creation time descending."""
        backups_dir = self.core.config.backups_path
        if not backups_dir.exists():
            return []
        files = [f for f in backups_dir.iterdir() if f.is_file() and BACKUP_FILENAME_PATTERN.match(f.name)]
        files.sort(key=lambda f: f.name, reverse=True)
        return [BackupInfo.from_path(f) for f in files]

    def get_backup_path(self, filename: str) -> Path:
        """Get path to a backup file with path-traversal protection."""
        path = self._resolve_safe_path(filename)
        if not path.exists():
            raise NotFoundError(f"Backup '{filename}' not found")
        return path

    def delete_backup(self, filename: str) -> None:
        """Delete a backup file."""
        path = self._resolve_safe_path(filename)
        if not path.exists():
            raise NotFoundError(f"Backup '{filename}' not found")
        path.unlink()
        logger.info("backup deleted", filename=filename)

    def _resolve_safe_path(self, filename: str) -> Path:
        """Resolve backup file path with path-traversal and filename validation."""
        if not BACKUP_FILENAME_PATTERN.match(filename):
            raise ValidationError(f"Invalid backup filename: {filename}")
        backups_dir = self.core.config.backups_path
        path = (backups_dir / filename).resolve()
        if not path.is_relative_to(backups_dir.resolve()):
            raise ValidationError(f"Invalid backup filename: {filename}")
        return path
