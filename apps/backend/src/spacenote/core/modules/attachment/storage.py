from pathlib import Path

SPACE_ATTACHMENTS_DIR = "__space__"


def get_pending_attachments_path(attachments_path: str) -> Path:
    """Get path to pending attachments directory."""
    return Path(attachments_path) / "pending"


def get_pending_attachment_path(attachments_path: str, number: int) -> Path:
    """Get path to a pending attachment file."""
    return get_pending_attachments_path(attachments_path) / str(number)


def write_pending_attachment_file(attachments_path: str, number: int, content: bytes) -> Path:
    """Write pending attachment file to disk."""
    file_path = get_pending_attachment_path(attachments_path, number)
    file_path.write_bytes(content)
    return file_path


def ensure_pending_attachments_dir(attachments_path: str) -> None:
    """Ensure pending directory exists."""
    get_pending_attachments_path(attachments_path).mkdir(parents=True, exist_ok=True)


def get_attachment_dir(attachments_path: str, space_slug: str, note_number: int | None) -> Path:
    """Get directory for attachments (note-level or space-level)."""
    if note_number is not None:
        return Path(attachments_path) / space_slug / str(note_number)
    return Path(attachments_path) / space_slug / SPACE_ATTACHMENTS_DIR


def get_attachment_file_path(attachments_path: str, space_slug: str, note_number: int | None, number: int) -> Path:
    """Get path to an attachment file."""
    return get_attachment_dir(attachments_path, space_slug, note_number) / str(number)


def write_attachment_file(attachments_path: str, space_slug: str, note_number: int | None, number: int, content: bytes) -> Path:
    """Write attachment file to disk."""
    file_path = get_attachment_file_path(attachments_path, space_slug, note_number, number)
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_bytes(content)
    return file_path


def read_pending_attachment_file(attachments_path: str, number: int) -> bytes:
    """Read pending attachment file from disk."""
    return get_pending_attachment_path(attachments_path, number).read_bytes()


def read_attachment_file(attachments_path: str, space_slug: str, note_number: int | None, number: int) -> bytes:
    """Read attachment file from disk."""
    return get_attachment_file_path(attachments_path, space_slug, note_number, number).read_bytes()
