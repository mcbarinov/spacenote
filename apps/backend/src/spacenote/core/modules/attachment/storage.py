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
    base = Path(attachments_path).resolve()
    subdir = str(note_number) if note_number is not None else SPACE_ATTACHMENTS_DIR
    result = base / space_slug / subdir
    # Prevent path traversal attacks (e.g., space_slug="../../../etc" escaping base directory)
    if not result.resolve().is_relative_to(base):
        raise ValueError("Invalid attachment path")
    return result


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


def move_pending_to_attachment(
    attachments_path: str, pending_number: int, space_slug: str, note_number: int, attachment_number: int
) -> Path:
    """Move pending attachment file to permanent attachment location."""
    src = get_pending_attachment_path(attachments_path, pending_number)
    dst = get_attachment_file_path(attachments_path, space_slug, note_number, attachment_number)
    dst.parent.mkdir(parents=True, exist_ok=True)
    src.rename(dst)
    return dst
