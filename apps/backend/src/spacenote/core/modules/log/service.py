from datetime import UTC, datetime

from spacenote.core.modules.log.models import ErrorLog
from spacenote.core.service import Service


class LogService(Service):
    """Service for reading application log files."""

    def get_error_log(self) -> ErrorLog:
        """Read the current error log file."""
        log_file = self.core.config.logs_path / "error.log"
        if not log_file.exists():
            return ErrorLog(content="", size=0, modified_at=None)
        stat = log_file.stat()
        content = log_file.read_text(encoding="utf-8", errors="replace")
        modified_at = datetime.fromtimestamp(stat.st_mtime, tz=UTC)
        return ErrorLog(content=content, size=stat.st_size, modified_at=modified_at)
